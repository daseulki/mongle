import { createServerClient } from '@supabase/ssr'
import { createClient as createBaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Server-side Supabase client for Server Components and Route Handlers.
 * Must be called inside a request context (async function).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll called from a Server Component — middleware handles refresh
          }
        },
      },
    }
  )
}

/**
 * Server Action용 Supabase 클라이언트.
 * @supabase/ssr의 createServerClient가 Server Action 컨텍스트에서
 * PostgREST 요청에 JWT를 포함하지 않는 문제를 우회하기 위해,
 * 세션 토큰을 Authorization 헤더에 명시적으로 포함한다.
 *
 * @returns { client, user } — DB 작업용 클라이언트와 인증된 사용자
 *          세션이 없으면 null 반환
 */
export async function createActionClient() {
  const ssrClient = await createClient()

  const {
    data: { user },
    error: userError,
  } = await ssrClient.auth.getUser()

  if (userError || !user) return null

  const {
    data: { session },
  } = await ssrClient.auth.getSession()

  if (!session?.access_token) return null

  const accessToken = session.access_token

  const client = createBaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      accessToken: async () => accessToken,
    }
  )

  return { client, user }
}

/**
 * Service-role Supabase client for server-side operations that bypass RLS.
 * MUST only be used in Server Components, Route Handlers, or Server Actions —
 * never in client-side code.
 */
export function createAdminClient() {
  return createBaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
