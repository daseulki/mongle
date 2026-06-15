import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@/lib/supabase/server'
import { createR2Client, R2_BUCKET } from '@/lib/r2/client'

const MAX_COVER_BYTES = 2 * 1024 * 1024   // 2 MB (클라이언트에서 리사이즈 후)
const MAX_AVATAR_BYTES = 256 * 1024        // 256 KB

/**
 * Accepts a multipart/form-data upload and PUT it directly to R2 (server-side).
 * This avoids browser CORS restrictions on presigned PUT URLs.
 *
 * FormData fields:
 *   file     — the image Blob
 *   type     — "cover" | "avatar"
 *   albumId  — required when type === "cover"
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const type = formData.get('type') as string | null
  const albumId = formData.get('albumId') as string | null

  if (!file || !type) {
    return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
  }
  if (type !== 'cover' && type !== 'avatar') {
    return NextResponse.json({ error: '지원하지 않는 이미지 타입입니다' }, { status: 400 })
  }

  const maxBytes = type === 'cover' ? MAX_COVER_BYTES : MAX_AVATAR_BYTES
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `파일 크기가 너무 커요 (최대 ${maxBytes / 1024}KB)` },
      { status: 413 },
    )
  }

  let storageKey: string

  if (type === 'cover') {
    if (!albumId) return NextResponse.json({ error: 'albumId가 필요합니다' }, { status: 400 })

    const { data: member } = await supabase
      .from('album_members')
      .select('role')
      .eq('album_id', albumId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!member || (member.role !== 'owner' && member.role !== 'co_host')) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }
    storageKey = `covers/${albumId}/${Date.now()}.jpg`
  } else {
    storageKey = `avatars/${user.id}/${Date.now()}.jpg`
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const r2 = createR2Client()

  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: storageKey,
    Body: buffer,
    ContentType: file.type,
    ContentLength: buffer.byteLength,
  }))

  const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${storageKey}`
  return NextResponse.json({ publicUrl })
}
