# 여행 앨범 앱 — 개발 가이드 (Development Guide)

> 버전: v0.1 | 작성일: 2026-05-28 | 기준: PRD v0.7
> 이 문서를 따라가면 로컬 개발 환경 → 배포까지 완료 가능합니다.

---

## 1. 프로젝트 한눈에 보기

| 항목 | 결정 |
|---|---|
| 프론트엔드 | Next.js 14 (App Router) + TypeScript + TailwindCSS |
| 인증 | Supabase Auth (Google OAuth) |
| DB | Supabase PostgreSQL + RLS |
| 스토리지 | Cloudflare R2 (S3 호환 SDK) |
| 서버 함수 | Supabase Edge Functions |
| 상태 관리 | TanStack Query (서버) / Zustand (글로벌) / useState (로컬) |
| PWA | Serwist |
| 배포 | Vercel |

---

## 2. 사전 준비

### 2.1 로컬 환경

| 도구 | 버전 | 비고 |
|---|---|---|
| Node.js | **20.x LTS 이상** | Next.js 14 요구사항 |
| pnpm | 9.x 이상 | (npm/yarn도 가능하지만 pnpm 권장) |
| Git | 2.x 이상 | |
| VS Code | 최신 | ESLint, Prettier, Tailwind IntelliSense 확장 설치 |

### 2.2 외부 서비스 계정 (모두 무료)

| 서비스 | 용도 | 가입 링크 |
|---|---|---|
| GitHub | 코드 저장소 | github.com |
| Supabase | DB · 인증 · Edge Functions | supabase.com |
| Cloudflare | R2 스토리지 | dash.cloudflare.com |
| Vercel | 배포 | vercel.com (GitHub 연동) |
| Google Cloud Console | OAuth Client 발급 | console.cloud.google.com |

---

## 3. 초기 셋업 순서 (의존성 순)

> ⚠️ 아래 순서를 지켜야 합니다. 환경 변수가 이전 단계 결과를 참조합니다.

### Step 1. Supabase 프로젝트 생성

1. supabase.com 로그인 → New project
2. Region: **Northeast Asia (Seoul)** 선택
3. DB 비밀번호 안전하게 보관 (재발급 불가)
4. 프로젝트 생성 후 Settings → API에서 다음 값 메모:
   - `Project URL`
   - `anon public key`
   - `service_role key` (비공개)

### Step 2. DB 스키마 적용

1. Supabase Dashboard → SQL Editor
2. `schema.sql` 내용을 **먼저 트랜잭션으로 dry-run**:
   ```sql
   BEGIN;
   -- 여기에 schema.sql 전체 붙여넣기
   ROLLBACK;  -- 에러 없으면 ROLLBACK → 다시 COMMIT으로 변경
   ```
3. 에러 없으면 실제 실행 (BEGIN/ROLLBACK 제거)
4. Table Editor에서 8개 테이블 생성 확인:
   `users`, `albums`, `album_members`, `album_invites`, `itinerary_items`, `photos`, `diary_entries`, `daily_weather`

### Step 3. Google OAuth 설정

1. Google Cloud Console → OAuth 2.0 Client IDs 생성 (Web application)
2. Authorized redirect URIs:
   - 로컬: `http://localhost:3000/auth/callback`
   - 프로덕션: `https://[your-domain].vercel.app/auth/callback`
   - Supabase: `https://[project-ref].supabase.co/auth/v1/callback`
3. Client ID / Secret 메모
4. Supabase → Authentication → Providers → Google → 활성화 + Client ID/Secret 입력

### Step 4. Cloudflare R2 버킷 생성

1. Cloudflare Dashboard → R2 → Create bucket
2. **앨범 사진 버킷**: `travel-album-photos`
3. **프로필 이미지 버킷**: `travel-album-profiles`
4. R2 API Tokens 발급 (Object Read & Write 권한)
   - `Access Key ID`, `Secret Access Key`, `Endpoint URL` 메모

### Step 5. Next.js 프로젝트 생성

```bash
pnpm create next-app@14 travel-album \
  --typescript --tailwind --eslint --app \
  --src-dir --import-alias "@/*"

cd travel-album
pnpm add @supabase/supabase-js @supabase/ssr \
  @tanstack/react-query zustand \
  browser-image-compression \
  @aws-sdk/client-s3 @aws-sdk/s3-request-presigner \
  date-fns lucide-react

pnpm add -D @serwist/next serwist
```

### Step 6. 환경 변수 설정

`.env.local` 파일 생성:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # 서버에서만 사용, 절대 클라이언트 노출 금지

# Cloudflare R2
R2_ACCOUNT_ID=xxxxxxxx
R2_ACCESS_KEY_ID=xxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxx
R2_BUCKET_PHOTOS=travel-album-photos
R2_BUCKET_PROFILES=travel-album-profiles
R2_PUBLIC_URL=https://pub-xxx.r2.dev  # 또는 커스텀 도메인

# Open-Meteo (API 키 없음, URL만)
OPEN_METEO_FORECAST_URL=https://api.open-meteo.com/v1/forecast
OPEN_METEO_ARCHIVE_URL=https://archive-api.open-meteo.com/v1/archive
OPEN_METEO_GEOCODING_URL=https://geocoding-api.open-meteo.com/v1/search

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`.env.local`을 **`.gitignore`에 반드시 추가** 확인.

### Step 7. PWA 설정

`next.config.js`:

```javascript
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
})

export default withSerwist({
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: 'https', hostname: 'pub-*.r2.dev' }] },
})
```

`public/manifest.json` 생성, `app/layout.tsx`에 메타 추가 (아이콘·테마 컬러).

### Step 8. Vercel 배포

1. GitHub에 코드 푸시
2. Vercel → New Project → GitHub 저장소 import
3. Environment Variables에 `.env.local` 내용 그대로 등록 (NEXT_PUBLIC_APP_URL은 Vercel 도메인으로)
4. Deploy 자동 실행

---

## 4. 프로젝트 구조

```
src/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # 루트 레이아웃
│   ├── page.tsx                      # S-03 홈
│   ├── welcome/page.tsx              # S-01 온보딩
│   ├── login/page.tsx                # S-02 로그인
│   ├── onboarding/profile/page.tsx   # S-02b 프로필 초기 설정
│   ├── auth/callback/route.ts        # OAuth 콜백
│   ├── settings/profile/page.tsx     # S-12 프로필 설정
│   ├── albums/
│   │   ├── new/page.tsx              # S-04 앨범 생성
│   │   └── [albumId]/
│   │       ├── layout.tsx            # 앨범 공통 레이아웃 (멤버 권한 로드)
│   │       ├── page.tsx              # S-05 일정 탭
│   │       ├── memories/page.tsx     # S-06 사진·일기 탭
│   │       ├── itinerary/[itemId]/edit/page.tsx
│   │       ├── photos/[photoId]/page.tsx
│   │       ├── diary/[date]/edit/page.tsx
│   │       ├── members/page.tsx
│   │       └── settings/page.tsx
│   ├── invite/[token]/page.tsx       # 초대 링크 진입
│   ├── api/                          # API 라우트 (Edge Function 미사용 시 폴백)
│   └── sw.ts                         # Service Worker
│
├── components/                       # 재사용 UI 컴포넌트
│   ├── ui/                           # Button, Input, Modal 등 기본
│   ├── album/                        # AlbumCard, RoleBadge 등
│   ├── itinerary/                    # ItineraryItem, DateBar 등
│   ├── photo/                        # PhotoGrid, PhotoUploader 등
│   └── diary/                        # DiaryCard, DiaryEditor 등
│
├── lib/                              # 도메인 로직 + 외부 연동
│   ├── supabase/
│   │   ├── client.ts                 # 브라우저용 클라이언트
│   │   ├── server.ts                 # 서버 컴포넌트용
│   │   └── middleware.ts             # 미들웨어용
│   ├── r2/
│   │   └── client.ts                 # S3 호환 R2 클라이언트
│   ├── image/
│   │   └── resize.ts                 # 클라이언트 리사이즈
│   ├── weather/
│   │   └── classify.ts               # WMO → 5단계 압축
│   └── auth/
│       └── middleware.ts             # 인증 미들웨어 (프로필 설정 체크 등)
│
├── store/                            # Zustand 글로벌 상태
│   ├── session.ts                    # 로그인 유저 정보
│   └── albumContext.ts               # 현재 앨범 컨텍스트
│
├── api/                              # TanStack Query hooks
│   ├── albums.ts                     # useAlbums, useAlbum, useCreateAlbum...
│   ├── itinerary.ts
│   ├── photos.ts
│   ├── diary.ts
│   ├── members.ts
│   └── weather.ts
│
├── types/                            # 타입 정의
│   ├── database.ts                   # Supabase 생성 타입
│   └── domain.ts                     # 도메인 타입 (Album, Photo 등)
│
└── middleware.ts                     # Next.js 미들웨어 (세션·프로필 체크)

supabase/
├── functions/                        # Edge Functions
│   ├── check-storage/                # 사진 업로드 전 용량 검증
│   ├── fetch-weather/                # 날씨 조회·기록
│   └── cleanup-deleted-albums/       # 7일 경과 앨범 삭제 (cron)
└── migrations/                       # DB 마이그레이션
```

---

## 5. 환경 변수 참조

| 변수명 | 노출 범위 | 출처 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트 | Supabase Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 | Supabase Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | **서버만** | Supabase Settings → API |
| `R2_*` | **서버만** | Cloudflare R2 API Tokens |
| `R2_PUBLIC_URL` | 클라이언트 | R2 버킷 Public Access URL |
| `OPEN_METEO_*` | 서버 | 고정 URL |
| `NEXT_PUBLIC_APP_URL` | 클라이언트 | 배포 도메인 |

> 🔒 **service_role key는 절대 클라이언트에 노출 금지**. 노출 시 RLS 우회 가능.

---

## 6. 개발 컨벤션

### 6.1 코드 스타일
- **세미콜론 없음**
- **camelCase** (변수·함수), PascalCase (컴포넌트·타입)
- **Early return (guard clause)** 우선
- `function` 키워드는 재사용 가능한 로직 / **arrow function**은 콜백·배열 메서드
- ES6+ 적극 활용: destructuring, `?.`, `??`, immutable 패턴

### 6.2 TypeScript
- `strict: true` 필수
- `any` 사용 금지, 불가피하면 `unknown` 후 좁히기
- 내보내는 함수·API 응답에는 **명시적 반환 타입**
- 유틸리티 타입(`Pick`, `Omit`, `Partial` 등) 적극 활용
- DB 타입은 `supabase gen types typescript --linked > src/types/database.ts`로 자동 생성

### 6.3 주석 (JSDoc)
- 재사용 함수에는 JSDoc 작성
- `@param`, `@returns` 명시
- 이모지·장식 기호 사용 금지

```typescript
/**
 * 사용자의 현재 앨범 내 역할을 조회한다.
 * @param albumId 앨범 식별자
 * @param userId 사용자 식별자
 * @returns 역할 ('owner' | 'co_host' | 'member') 또는 멤버 아닌 경우 null
 */
async function getMyRole(albumId: string, userId: string): Promise<Role | null> {
  // ...
}
```

### 6.4 파일·폴더 명명
- 컴포넌트: `PascalCase.tsx` (예: `AlbumCard.tsx`)
- 훅·유틸: `camelCase.ts` (예: `useAlbums.ts`)
- 페이지·라우트: Next.js 규칙 (`page.tsx`, `layout.tsx`)

---

## 7. 핵심 구현 패턴

### 7.1 Supabase 클라이언트 (3가지 컨텍스트)

```typescript
// src/lib/supabase/client.ts — 브라우저용
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// src/lib/supabase/server.ts — 서버 컴포넌트용
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* 표준 패턴 */ } },
  )
}
```

### 7.2 인증·프로필 미들웨어

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { user } = await getSession(request)

  // 미로그인 → 로그인 화면
  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 신규 사용자 (프로필 미설정) → 강제 onboarding
  if (user) {
    const hasProfile = await checkUserProfile(user.id)
    if (!hasProfile && request.nextUrl.pathname !== '/onboarding/profile') {
      return NextResponse.redirect(new URL('/onboarding/profile', request.url))
    }
  }

  return NextResponse.next()
}
```

### 7.3 RLS 정책 패턴

모든 테이블에 `auth.uid()` 기반 RLS 활성화. 권한은 항상 **`album_members`의 (album_id, user_id) 조합 검증**으로 통일.

```sql
-- 예: photos 테이블 SELECT — 앨범 멤버만 조회
create policy "photos_select_member"
  on photos for select
  using (
    exists (
      select 1 from album_members
      where album_id = photos.album_id
        and user_id = auth.uid()
    )
  );

-- 예: photos DELETE — 본인 업로드한 것만
create policy "photos_delete_own"
  on photos for delete
  using (uploaded_by = auth.uid());

-- 예: itinerary_items INSERT — 방장/Co-host만
create policy "itinerary_insert_admin"
  on itinerary_items for insert
  with check (
    exists (
      select 1 from album_members
      where album_id = itinerary_items.album_id
        and user_id = auth.uid()
        and role in ('owner', 'co_host')
    )
  );
```

> RLS 정책 전체는 TODO-1 (API 명세서)에서 화면별로 정리 예정

### 7.4 TanStack Query 패턴

```typescript
// src/api/albums.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const albumKeys = {
  all: ['albums'] as const,
  list: () => [...albumKeys.all, 'list'] as const,
  detail: (id: string) => [...albumKeys.all, 'detail', id] as const,
}

export function useAlbums() {
  return useQuery({
    queryKey: albumKeys.list(),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('albums')
        .select('*, album_members!inner(role)')
        .order('start_date', { ascending: false })
      if (error) throw error
      return data
    },
    staleTime: 60_000,
  })
}

export function useCreateAlbum() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateAlbumInput): Promise<Album> => {
      // 생성 + 본인 owner 멤버 등록 (트랜잭션 RPC 권장)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: albumKeys.list() })
    },
  })
}
```

### 7.5 Zustand 스토어 (선택자 패턴)

```typescript
// src/store/session.ts
import { create } from 'zustand'

interface SessionState {
  userId: string | null
  nickname: string | null
  avatarUrl: string | null
  setUser: (user: SessionUser) => void
  clear: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  userId: null,
  nickname: null,
  avatarUrl: null,
  setUser: (user) => set({ userId: user.id, nickname: user.nickname, avatarUrl: user.avatarUrl }),
  clear: () => set({ userId: null, nickname: null, avatarUrl: null }),
}))

// 사용 시 granular selector — 필요한 값만 구독해 불필요한 리렌더 방지
const nickname = useSessionStore((s) => s.nickname)
```

### 7.6 이미지 업로드 (클라이언트 리사이즈 + R2)

```typescript
// src/lib/image/resize.ts
import imageCompression from 'browser-image-compression'

export async function resizeForUpload(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 5,
    maxWidthOrHeight: 2560,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.85,
  })
}

// src/api/photos.ts (업로드 흐름)
async function uploadPhotos(albumId: string, files: File[]): Promise<Photo[]> {
  // 1. 클라이언트 리사이즈
  const resized = await Promise.all(files.map(resizeForUpload))
  const totalBytes = resized.reduce((sum, f) => sum + f.size, 0)

  // 2. Edge Function으로 용량 검증
  const { allowed } = await invokeEdgeFunction('check-storage', {
    albumId,
    totalBytes,
  })
  if (!allowed) throw new Error('STORAGE_FULL')

  // 3. 각 파일을 R2에 PUT (presigned URL 방식 권장)
  const photos = await Promise.all(
    resized.map((file) => uploadSinglePhoto(albumId, file)),
  )

  return photos
}
```

### 7.7 Edge Function 패턴

```typescript
// supabase/functions/check-storage/index.ts
import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // 1. JWT 검증
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
  if (!user) return new Response('Unauthorized', { status: 401 })

  // 2. 입력 파싱
  const { albumId, totalBytes } = await req.json()

  // 3. 멤버 검증
  const { data: member } = await supabase
    .from('album_members')
    .select('id')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!member) return new Response('Forbidden', { status: 403 })

  // 4. 용량 검증
  const { data: album } = await supabase
    .from('albums')
    .select('storage_used_bytes, storage_limit_bytes')
    .eq('id', albumId)
    .single()

  const allowed = (album.storage_used_bytes + totalBytes) <= album.storage_limit_bytes
  return Response.json({ allowed })
})
```

---

## 8. Git 워크플로우

### 브랜치 전략 (MVP 단순화)
- `main` — 항상 배포 가능 상태, Vercel Production
- `feature/*` — 기능 단위 브랜치, PR로 `main`에 머지
- 가족용 비공개 앱이라 `develop` 브랜치 생략

### 커밋 메시지
- 형식: `[type] 메시지` (예: `[feat] 앨범 생성 화면 구현`)
- 타입: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`

### PR 체크리스트
- [ ] 로컬에서 `pnpm build` 성공
- [ ] `pnpm lint` 에러 없음
- [ ] TypeScript 에러 없음
- [ ] PRD/IA 영향 시 문서 동기 갱신

---

## 9. 테스트 전략 (MVP 수준)

MVP 단계에서는 자동화 테스트보다 **수동 시나리오 테스트**에 집중. 단, 핵심 비즈니스 로직은 단위 테스트 권장.

### 단위 테스트가 필요한 부분
- WMO 코드 → 5단계 변환 로직
- 용량 계산·검증
- 권한 판별 함수 (`getMyRole`, `canManageMembers` 등)

### 수동 테스트 시나리오 (출시 전 필수)
- [ ] 첫 로그인 → 프로필 설정 → 홈 진입
- [ ] 앨범 생성 → 초대 링크 발급 → 다른 계정으로 합류
- [ ] 사진 10장 업로드 → 다른 멤버 화면에 반영 확인
- [ ] 일기 작성·수정 (1인 1일 1개 제약 확인)
- [ ] 일정 추가 (방장만 가능 확인)
- [ ] 강퇴 → 콘텐츠 삭제 확인
- [ ] 앨범 삭제 요청 → 7일 유예 배너 확인 (cron은 별도 검증)
- [ ] 날씨 조회 → daily_weather에 저장 확인
- [ ] iOS Safari에서 PWA 홈 화면 추가 → 정상 동작 확인
- [ ] 5GB 한도 도달 시 업로드 차단 확인

---

## 10. 참조 문서

| 문서 | 용도 |
|---|---|
| `PRD-v0.7.md` | 정본 요구사항 (US, 정책, 데이터 모델 요약) |
| `schema.sql` | 실행 가능한 DB 스키마 |
| `travel-album-erd.html` | ERD 다이어그램 |
| `travel-album-ia.md` | 정보 구조 + URL 라우팅 + 권한 매트릭스 |
| `travel-album-screen-spec.md` | 화면별 레이아웃 명세 |
| `travel-album-screen-states.md` | 로딩/빈/에러 상태 + 인터랙션 |
| `travel-album-sequence-flows.md` | 핵심 6개 플로우 시퀀스 다이어그램 |
| `scaling-cost-analysis.md` | 비용 시나리오 + 모니터링 |
| `TODO.md` | 진행 현황 + 잔여 작업 |

---

## 11. 다음 단계

1. **TODO-1: API · 쿼리 명세서 작성** — 화면별 데이터 패칭 정의, RLS 정책 전체 작성
2. **TODO-2: 컴포넌트 트리 설계** — 화면을 React 컴포넌트로 분해, 공유 컴포넌트 식별
3. **개발 착수** — Step 1~8 순서대로 실행

> 💡 개발 시작 전 TODO-1을 먼저 완료하는 것을 권장합니다. 화면별 쿼리·RLS를 명확히 알아야 데이터 페칭 코드를 일관되게 작성할 수 있습니다.