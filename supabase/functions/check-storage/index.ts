import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleCors, jsonResponse } from '../_shared/cors.ts'

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ code: 'UNAUTHORIZED', message: '로그인이 필요합니다' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return jsonResponse({ code: 'UNAUTHORIZED', message: '인증에 실패했습니다' }, 401)
  }

  let body: { albumId?: string; fileSizeBytes?: number }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ code: 'BAD_REQUEST', message: '요청 본문이 올바르지 않습니다' }, 400)
  }

  const { albumId, fileSizeBytes } = body
  if (!albumId || typeof fileSizeBytes !== 'number' || fileSizeBytes <= 0) {
    return jsonResponse({ code: 'BAD_REQUEST', message: 'albumId, fileSizeBytes 가 필요합니다' }, 400)
  }

  // 멤버십 확인
  const { data: member } = await supabase
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) {
    return jsonResponse({ code: 'FORBIDDEN', message: '앨범 멤버가 아닙니다' }, 403)
  }

  // 스토리지 용량 확인
  const { data: album } = await supabase
    .from('albums')
    .select('storage_used_bytes, storage_limit_bytes')
    .eq('id', albumId)
    .single()

  if (!album) {
    return jsonResponse({ code: 'NOT_FOUND', message: '앨범을 찾을 수 없습니다' }, 404)
  }

  const remainingBytes = album.storage_limit_bytes - album.storage_used_bytes
  const allowed = album.storage_used_bytes + fileSizeBytes <= album.storage_limit_bytes

  return jsonResponse({ allowed, remaining_bytes: remainingBytes })
})
