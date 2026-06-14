import { createClient } from 'jsr:@supabase/supabase-js@2'
import { S3Client, DeleteObjectsCommand } from 'npm:@aws-sdk/client-s3@3'

// ─── 인증: service_role 키로 호출했는지 검증 ──────────────────────────────────
// pg_cron 또는 Supabase Scheduler가 Authorization: Bearer <service_role_key> 로 호출
function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get('Authorization')
  const expected = `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
  return authHeader === expected
}

// ─── R2 클라이언트 ────────────────────────────────────────────────────────────
function createR2(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: Deno.env.get('R2_ENDPOINT')!,
    credentials: {
      accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
      secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
    },
  })
}

async function deleteR2Objects(r2: S3Client, bucket: string, keys: string[]): Promise<void> {
  // S3 DeleteObjects는 한 번에 최대 1000개
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000)
    await r2.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch.map((Key) => ({ Key })) },
      }),
    )
  }
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ code: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // delete_requested_at 로부터 7일이 경과한 앨범 조회
  const { data: albums, error: fetchError } = await supabaseAdmin
    .from('albums')
    .select('id')
    .not('delete_requested_at', 'is', null)
    .lt('delete_requested_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  if (fetchError) {
    console.error('[cleanup-deleted-albums] fetch error:', fetchError)
    return new Response(JSON.stringify({ code: 'INTERNAL_ERROR', message: fetchError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!albums || albums.length === 0) {
    return new Response(JSON.stringify({ deleted_count: 0, album_ids: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const albumIds = albums.map((a) => a.id as string)
  const r2 = createR2()
  const bucket = Deno.env.get('R2_BUCKET_NAME') ?? 'mongle-trip'
  const deletedIds: string[] = []
  const errors: string[] = []

  for (const albumId of albumIds) {
    try {
      // 1. 앨범 사진 storage_key 목록 수집
      const { data: photos } = await supabaseAdmin
        .from('photos')
        .select('storage_key')
        .eq('album_id', albumId)

      const storageKeys = (photos ?? []).map((p) => p.storage_key as string)

      // 2. R2 오브젝트 삭제 (배치)
      if (storageKeys.length > 0) {
        await deleteR2Objects(r2, bucket, storageKeys)
      }

      // 3. 앨범 DB 레코드 삭제 (CASCADE → album_members, photos, diary_entries 등 자동 삭제)
      const { error: deleteError } = await supabaseAdmin
        .from('albums')
        .delete()
        .eq('id', albumId)

      if (deleteError) {
        console.error(`[cleanup] delete album ${albumId} error:`, deleteError)
        errors.push(albumId)
      } else {
        deletedIds.push(albumId)
        console.log(`[cleanup] deleted album ${albumId} (${storageKeys.length} photos)`)
      }
    } catch (err) {
      console.error(`[cleanup] error processing album ${albumId}:`, err)
      errors.push(albumId)
    }
  }

  return new Response(
    JSON.stringify({
      deleted_count: deletedIds.length,
      album_ids: deletedIds,
      error_count: errors.length,
      error_ids: errors,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
