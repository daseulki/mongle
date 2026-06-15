import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@/lib/supabase/server'
import { createR2Client, R2_BUCKET } from '@/lib/r2/client'

/**
 * Issues a presigned PUT URL for cover or avatar images.
 * No storage quota enforcement — these are small files outside the per-album limit.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const body = (await req.json()) as {
    type?: 'cover' | 'avatar'
    albumId?: string
    fileName?: string
    fileType?: string
  }
  const { type, albumId, fileName, fileType } = body

  if (!type || !fileName || !fileType) {
    return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
  }

  if (type !== 'cover' && type !== 'avatar') {
    return NextResponse.json({ error: '지원하지 않는 이미지 타입입니다' }, { status: 400 })
  }

  let storageKey: string
  if (type === 'cover') {
    if (!albumId) {
      return NextResponse.json({ error: 'albumId가 필요합니다' }, { status: 400 })
    }
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

  const r2 = createR2Client()
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: storageKey,
    ContentType: fileType,
  })

  const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 300 })
  const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${storageKey}`

  return NextResponse.json({ presignedUrl, publicUrl })
}
