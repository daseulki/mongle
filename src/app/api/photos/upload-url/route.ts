import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@/lib/supabase/server'
import { createR2Client, R2_BUCKET } from '@/lib/r2/client'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const body = (await req.json()) as {
    albumId?: string
    fileName?: string
    fileType?: string
    fileSizeBytes?: number
  }
  const { albumId, fileName, fileType, fileSizeBytes } = body

  if (!albumId || !fileName || !fileType || !fileSizeBytes) {
    return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
  }

  const { data: member } = await supabase
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ error: '앨범 멤버가 아닙니다' }, { status: 403 })
  }

  const { data: album } = await supabase
    .from('albums')
    .select('storage_used_bytes, storage_limit_bytes')
    .eq('id', albumId)
    .single()

  if (!album) {
    return NextResponse.json({ error: '앨범을 찾을 수 없습니다' }, { status: 404 })
  }

  if (album.storage_used_bytes + fileSizeBytes > album.storage_limit_bytes) {
    return NextResponse.json({ error: '저장 공간이 부족합니다' }, { status: 409 })
  }

  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storageKey = `albums/${albumId}/${user.id}/${Date.now()}_${safeFileName}`
  const r2 = createR2Client()

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: storageKey,
    ContentType: fileType,
    ContentLength: fileSizeBytes,
  })

  const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 300 })
  const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${storageKey}`

  return NextResponse.json({ presignedUrl, storageKey, publicUrl })
}
