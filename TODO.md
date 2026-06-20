# 몽글여행 앱 — 프로젝트 진행 현황 & TODO

> 최종 갱신: 2026-06-15 (S-05·S-07 기획 업데이트 반영) | 기준 정본: PRD v0.7

---

## ✅ 완료된 작업

| 단계 | 산출물 | 파일 |
|---|---|---|
| 요구사항 정의 | MVP 요구사항 정의서 (정본) | `PRD-v0.7.md` |
| 정책 결정 | 엣지 케이스 5건 + 검토 이슈 5건 + 사용자/역할 개념 명확화 | PRD v0.7 §0, §1 |
| 데이터 설계 | ERD + 실행 가능한 스키마 | `schema.sql`, `travel-album-erd.html` |
| 화면 설계 | 12개 화면 + 3개 모달 레이아웃 | `travel-album-screen-spec.md` |
| 정보 구조 | IA (앱맵·네비·라우팅·권한) | `travel-album-ia.md` |
| 화면 상태 | 로딩/빈/에러 + 인터랙션 명세 | `travel-album-screen-states.md` |
| 플로우 시각화 | 6개 시퀀스 다이어그램 (로그인·앨범생성·합류·일정·사진·삭제) | `travel-album-sequence-flows.md` |
| 백로그 컨셉 | 여행기 Output 기능 컨셉 정리 | `travel-diary-feature-concept.md` |
| 비용 분석 | 스토리지·인프라 확장 시나리오별 비용 추정 | `scaling-cost-analysis.md` |
| 개발 가이드 | 셋업·구조·컨벤션·구현 패턴·테스트 | `DEV_GUIDE.md` |
| **[TODO-3] 개발 착수 — 코드 인프라** | 패키지 설치·디렉토리 구조·Supabase 클라이언트·인증 미들웨어·TanStack Query·Zustand·PWA(Serwist)·루트 레이아웃 | 아래 신규 파일 참고 |
| **[TODO-3-EXT] 외부 서비스 셋업** | Supabase 스키마·타입·R2 버킷·API 토큰·.env.local | 아래 참고 |
| **[TODO-4] Google OAuth 설정** | Google Cloud Console OAuth Client ID + Supabase Auth Providers 연동 | 외부 작업 완료 |
| **[TODO-5] 인증 플로우 구현** | 로그인·OAuth 콜백·온보딩 프로필·세션 hydration | 아래 신규 파일 참고 |
| **[TODO-6] 기본 UI 컴포넌트** | shadcn-ui + 디자인 토큰: Button·Input·Textarea·Dialog·Toast(Sonner)·Skeleton·AppLayout·PageHeader | `src/components/ui/`, `src/components/layout/` |
| **[TODO-7] 홈 화면 (앨범 목록)** | `useAlbums` 훅·AlbumCard·4가지 상태(로딩/빈/에러/목록)·FAB | `src/app/page.tsx`, `src/app/HomeClient.tsx`, `src/components/album/AlbumCard.tsx`, `src/queries/albums.ts` |
| **[TODO-8] 앨범 생성** | `createAlbum` Server Action·앨범 생성 폼 (RHF + native validation)·날짜 범위 선택·목적지 입력 | `src/actions/album.ts`, `src/app/albums/new/page.tsx`, `src/app/albums/new/NewAlbumForm.tsx` |
| **[TODO-9] 앨범 레이아웃 & 탭 네비게이션** | 앨범 컨텍스트 1회 fetch → React Context 전달·탭 네비게이션 (일정↔사진·일기)·useAlbumDetail·useAlbumMembers 훅 | `src/app/albums/[albumId]/layout.tsx`, `AlbumContext.tsx`, `src/components/album/AlbumTabNav.tsx`, `src/queries/albums.ts` |
| **[TODO-10] 일정 탭** | DateBar·ItineraryItem·ItineraryForm·useItinerary 훅·일정 추가/수정/삭제 Server Action (방장·Co-host 전용)·일정 추가/수정 페이지 (S-07) | `src/queries/itinerary.ts`, `src/actions/itinerary.ts`, `src/components/itinerary/`, `src/app/albums/[albumId]/ItineraryClient.tsx`, `src/app/albums/[albumId]/itinerary/` |
| **[TODO-14] RLS 정책 적용** | 6개 테이블 RLS 활성화·정책 적용, SECURITY DEFINER 헬퍼 함수 3종 | `supabase/migrations/0005_rls_complete.sql` |
| **[TODO-15] Supabase Edge Functions** | check-storage·fetch-weather·cleanup-deleted-albums + config.toml 스케줄 | `supabase/functions/` |
| **[TODO-15-1] 사진 삭제 & 용량 관리** | PhotoGrid 길게 누르기 삭제·StorageGauge·PhotoUploadButton 파일 검증·용량 초과 차단 | `src/components/photo/PhotoGrid.tsx`, `src/components/photo/PhotoUploadButton.tsx`, `src/app/albums/[albumId]/memories/MemoriesClient.tsx` |
| **[TODO-15-2] 멤버 강퇴 & Co-host 지정** | kickMember·updateMemberRole Server Action·MembersClient 강퇴 모달·Co-host 토글·D-Day 초대·새 링크 확인 모달 | `src/actions/member.ts`, `src/app/albums/[albumId]/members/MembersClient.tsx` |
| **[TODO-15-3] 홈 앨범 정렬 & 삭제 배너** | albumStatusRank() 그룹 정렬(진행 중→예정→종료), AlbumCard 삭제 예정 빨간 배너 | `src/queries/albums.ts`, `src/components/album/AlbumCard.tsx` |
| **[TODO-15-4] 날씨 위젯** | classify.ts WMO 매핑·useWeather 훅·WeatherWidget 수평 스트립·ItineraryClient 통합 | `src/lib/weather/classify.ts`, `src/queries/weather.ts`, `src/components/itinerary/WeatherWidget.tsx` |
| **[TODO-15-5] 사진 상세 뷰** | 풀스크린 뷰어·터치 스와이프·화살표 탐색·다운로드·본인 사진 삭제 모달 | `src/app/albums/[albumId]/photos/[photoId]/page.tsx`, `PhotoDetailClient.tsx` |
| **[TODO-15-6] 삭제 예정 배너(M-03) & 초대 바텀시트** | layout.tsx M-03 배너·AlbumSettingsForm 삭제 취소 버튼·invite 참여 차단·NewAlbumForm 초대 바텀시트 | `src/app/albums/[albumId]/layout.tsx`, `AlbumSettingsForm.tsx`, `src/app/invite/[token]/page.tsx`, `src/app/albums/new/NewAlbumForm.tsx` |
| **[TODO-15-P2] 커버·아바타 이미지 업로드** | ImageUploadPicker 공용 컴포넌트·resizeCover/resizeAvatar·images/upload-url API route·NewAlbumForm·AlbumSettingsForm·ProfileForm(온보딩+설정) | `src/components/ui/ImageUploadPicker.tsx`, `src/lib/image/resize.ts`, `src/app/api/images/upload-url/route.ts` |
| **[TODO-15-P2] 일기 임시 저장 (draft)** | DiaryEditForm localStorage 자동 저장(debounce 1s) + 복원 토스트 | `src/app/albums/[albumId]/diary/[date]/edit/DiaryEditForm.tsx` |

### TODO-3에서 생성된 파일

| 파일 | 설명 |
|---|---|
| `.env.local` | 환경변수 (Supabase, R2 값 입력 완료) |
| `.env.local.example` | 환경변수 템플릿 |
| `src/lib/supabase/client.ts` | 브라우저용 Supabase 클라이언트 |
| `src/lib/supabase/server.ts` | 서버용 Supabase 클라이언트 |
| `src/lib/r2/client.ts` | Cloudflare R2 S3 클라이언트 |
| `src/proxy.ts` | 인증·온보딩 리다이렉트 (Next.js 16 proxy) |
| `src/store/session.ts` | Zustand 세션 스토어 |
| `src/queries/keys.ts` | TanStack Query 키 팩토리 |
| `src/components/providers.tsx` | QueryClientProvider 래퍼 |
| `src/types/database.ts` | Supabase 자동 생성 타입 |
| `src/app/sw.ts` | Serwist 서비스 워커 |
| `public/manifest.json` | PWA 매니페스트 |
| `src/app/layout.tsx` | 루트 레이아웃 (ko, PWA 메타태그, Providers) |
| `next.config.ts` | Serwist 플러그인·removeConsole·R2 이미지 도메인 |

### TODO-3-EXT 완료 항목

- [x] Supabase 프로젝트 생성 (호주 리전)
- [x] `schema.sql` 적용 (8개 테이블)
- [x] `supabase gen types typescript --linked` 실행 → `src/types/database.ts`
- [x] Cloudflare R2 버킷 생성 (`mongle-trip`)
- [x] R2 API 토큰 발급 (Object Read & Write)
- [x] `.env.local` 파일 생성 (Supabase URL/키, R2 자격증명)

### TODO-5에서 생성된 파일

| 파일 | 설명 |
|---|---|
| `src/app/globals.css` | 디자인 시스템 import + Tailwind `@theme` 매핑 |
| `src/app/login/page.tsx` | 로그인 페이지 (Google OAuth 버튼) |
| `src/components/auth/GoogleLoginButton.tsx` | Google 로그인 버튼 (Client Component) |
| `src/app/auth/callback/route.ts` | OAuth 코드 교환 Route Handler |
| `src/app/onboarding/profile/page.tsx` | 닉네임 설정 페이지 (Server Component) |
| `src/app/onboarding/profile/ProfileForm.tsx` | 닉네임 폼 (`useActionState`) |
| `src/actions/profile.ts` | `createUserProfile` Server Action (Zod + upsert) |
| `src/components/providers.tsx` | `SessionHydrator` 추가 (Zustand ↔ Supabase 동기화) |

> **RLS 참고:** Supabase 신규 프로젝트는 RLS 기본 활성화. `users` 테이블 최소 정책 3개 수동 적용 완료 (select/insert/update). 나머지 테이블 정책은 TODO-14에서 일괄 처리.

---

## 📌 다음 작업 (우선순위 순)

> **작업 흐름:** TODO-4(외부) → TODO-5(인증) → TODO-6(UI) → TODO-7(홈) → ...
> TODO-1·2(API 명세서·컴포넌트 트리)는 별도 문서 대신 각 구현 단계에 인라인으로 통합

---

### ✅ [TODO-9] 앨범 레이아웃 & 탭 네비게이션

- [x] `src/app/albums/[albumId]/layout.tsx` — 앨범 컨텍스트 1회 fetch (역할·멤버 목록) → React Context 전달
- [x] 탭 네비게이션 컴포넌트 (일정 ↔ 메모리) — `src/components/album/AlbumTabNav.tsx`
- [x] `src/queries/albums.ts` — `useAlbumDetail`, `useAlbumMembers` 훅

---

### ✅ [TODO-10] 일정 탭

- [x] `src/app/albums/[albumId]/page.tsx` — 일정 탭 메인 (ItineraryClient 래퍼)
- [x] `src/components/itinerary/DateBar.tsx` — 날짜별 가로 스크롤 (date-fns, 한국어 요일)
- [x] `src/components/itinerary/ItineraryItem.tsx` — 장소·시간·메모 타임라인 카드
- [x] `src/components/itinerary/ItineraryForm.tsx` — 추가·수정 공용 폼 (RHF + Zod)
- [x] `src/actions/itinerary.ts` — `createItineraryItem`, `updateItineraryItem`, `deleteItineraryItem` (방장·Co-host 전용)
- [x] `src/queries/itinerary.ts` — `useItinerary` 훅
- [x] `src/app/albums/[albumId]/itinerary/new/page.tsx` — 일정 추가 (S-07)
- [x] `src/app/albums/[albumId]/itinerary/[itemId]/edit/page.tsx` — 일정 수정 (S-07)

---

### ✅ [TODO-6] 기본 UI 컴포넌트 (TODO-5와 병행 가능)

> 디자인 토큰: `src/app/design-system.css` 기준
> shadcn-ui 사용해서 컴포넌트 최적화 

- [x] `src/components/ui/Button.tsx` — primary / secondary / ghost 변형 (Base UI, 44px+ 터치타겟, `buttonVariants()` export)
- [x] `src/components/ui/Input.tsx` — label 포함, 에러 상태 (`useId`, aria-invalid)
- [x] `src/components/ui/Textarea.tsx` — label 포함, 에러 상태
- [x] `src/components/ui/dialog.tsx` — 포커스 트랩, Escape 닫기 (Base UI Dialog)
- [x] `src/components/ui/Toast.tsx` — Sonner 래퍼, success/error/info, 3초 자동 닫기, bottom-center
- [x] `src/components/ui/skeleton.tsx` — 레이아웃 모양 유지 로딩 플레이스홀더
- [x] `src/components/layout/AppLayout.tsx` — 앱 래퍼 레이아웃
- [x] `src/components/layout/PageHeader.tsx` — 뒤로가기·타이틀·우측 슬롯

---

### ✅ [TODO-7] 홈 화면 (앨범 목록)

> 선행 조건: TODO-5

- [x] `src/queries/albums.ts` — `useAlbums` 훅 (album_members 기반, memberCount 내장)
- [x] `src/components/album/AlbumCard.tsx` — 커버·제목·날짜·멤버 수·D-Day 배지·역할 배지
- [x] `src/app/HomeClient.tsx` — 4가지 상태 (로딩 스켈레톤 / 빈 화면 / 에러 / 목록)
- [x] `src/app/page.tsx` — Server Component 래퍼
- [x] FAB (앨범 생성 버튼) — 우하단 고정, iOS safe area 대응

---

### ✅ [TODO-8] 앨범 생성

> 선행 조건: TODO-7

- [x] `src/app/albums/new/page.tsx` — 생성 폼 (React Hook Form + native validation)
- [x] `src/app/albums/new/NewAlbumForm.tsx` — Client Component (크로스필드 검증은 validate 콜백)
- [x] Server Action: `createAlbum` (`src/actions/album.ts`) — 앨범 insert + `owner` 멤버 등록, 실패 시 orphan 정리
- [x] 날짜 범위 선택 (native `<input type="date">`, 종료일 min=시작일, 최대 30일 검증)
- [x] 목적지 입력 (선택 사항, max 50자)
- [x] Zod 검증은 Server Action 경계에만 적용 (client zodResolver 호환 이슈로 제거)

---


### ✅ [TODO-11] 메모리 탭 (사진 + 일기)

> 선행 조건: TODO-9

- [x] `src/app/albums/[albumId]/memories/page.tsx` + `MemoriesClient.tsx` — 사진·일기 통합 탭
- [x] `src/lib/image/resize.ts` — `browser-image-compression` 래퍼 (2560px, quality 0.85)
- [x] `src/components/photo/PhotoGrid.tsx` — 날짜별 그루핑, 3열 그리드, 스켈레톤
- [x] `src/components/photo/PhotoUploadButton.tsx` — FAB: 리사이즈 → 스토리지 검증 → R2 PUT → DB insert
- [x] `src/app/api/photos/upload-url/route.ts` — Presigned PUT URL 발급 + 스토리지 한도 검증
- [x] `src/actions/photo.ts` — `insertPhoto`, `deletePhoto` Server Action
- [x] `src/components/diary/DiaryCard.tsx` — 닉네임·날짜·본문, 내 일기 수정 링크
- [x] `src/app/albums/[albumId]/diary/[date]/edit/page.tsx` + `DiaryEditForm.tsx` — 1인 1일 1개 upsert, 삭제
- [x] `src/queries/photos.ts`, `src/queries/diary.ts` — TanStack Query 훅

---

### ✅ [TODO-12] 초대 & 멤버 관리

> 선행 조건: TODO-9

- [x] `src/app/invite/[token]/page.tsx` — 토큰 검증 + 앨범 합류 (로그인 없으면 /login?next= redirect, 이미 멤버이면 앨범으로 redirect, 만료/무효 링크 에러 화면)
- [x] `src/app/invite/[token]/JoinButton.tsx` — joinAlbum 액션 호출 Client Component
- [x] `src/app/albums/[albumId]/members/page.tsx` — 멤버 목록 페이지 (독립 AppLayout + PageHeader)
- [x] `src/app/albums/[albumId]/members/MembersClient.tsx` — 멤버 목록·역할 배지, 초대 링크 UI (owner/co_host 전용)
- [x] Server Action: `generateInviteLink` — owner/co_host 전용, 기존 활성 링크 비활성화 후 7일 유효 토큰 생성 (`src/actions/invite.ts`)
- [x] Server Action: `joinAlbum` — 토큰 검증 + `album_members` insert (`src/actions/invite.ts`)
- [x] `src/queries/invite.ts` — `useActiveInvite` TanStack Query 훅
- [x] `src/queries/keys.ts` — `inviteKeys` 팩토리 추가

---

### ✅ [TODO-13] 설정 화면

> 선행 조건: TODO-9

- [x] `src/app/albums/[albumId]/settings/page.tsx` + `AlbumSettingsForm.tsx` — 앨범 제목·기간·목적지 수정, 삭제 요청 (7일 유예, owner 전용)
- [x] `src/app/settings/profile/page.tsx` + `ProfileSettingsForm.tsx` — 닉네임 수정, 연결 계정 표시, 로그아웃
- [x] `src/actions/album.ts` — `updateAlbum`, `requestAlbumDeletion` 추가
- [x] `src/actions/profile.ts` — `updateProfile` 추가
- [x] 홈 헤더 우상단 프로필 아이콘 → `/settings/profile`
- [x] 멤버 페이지 하단 "앨범 설정" 링크 → `/albums/[albumId]/settings` (owner 전용)

---

### ✅ [TODO-14] RLS 정책 적용

> 선행 조건: TODO-11 (핵심 기능 완성 후 보안 강화)
> **실행 방법:** `supabase/migrations/0005_rls_complete.sql`을 Supabase SQL Editor에서 실행

- [x] `albums`: 멤버만 SELECT, owner만 UPDATE/DELETE
- [x] `album_members`: 멤버 SELECT, owner만 INSERT(초대)/DELETE(강퇴)
- [x] `itinerary_items`: 멤버 SELECT, owner/co_host만 INSERT/UPDATE/DELETE
- [x] `photos`: 멤버 SELECT/INSERT, 본인 업로드만 DELETE
- [x] `diary_entries`: 멤버 SELECT, 본인만 INSERT/UPDATE/DELETE
- [x] `album_invites`: owner/co_host INSERT, 공개 SELECT (토큰 검증용)
- [x] 모든 테이블 `ENABLE ROW LEVEL SECURITY` 적용
- [x] SECURITY DEFINER 헬퍼 함수 3종: `fn_is_album_member`, `fn_is_album_host`, `fn_is_album_owner`

---

### ✅ [TODO-15] Supabase Edge Functions

> 선행 조건: TODO-11
> **배포:** `supabase functions deploy` (함수 3개 + config.toml 스케줄 포함)

- [x] `supabase/functions/check-storage/index.ts` — JWT 검증 + 멤버 확인 + 잔여 용량 반환
- [x] `supabase/functions/fetch-weather/index.ts` — Open-Meteo 호출 + WMO 5단계 변환 + `daily_weather` upsert + 지오코딩 lazy init
- [x] `supabase/functions/cleanup-deleted-albums/index.ts` — 7일 경과 앨범 R2 오브젝트 삭제 후 DB 물리 삭제 (cron)
- [x] `supabase/functions/_shared/cors.ts`, `_shared/wmo.ts` — 공유 유틸리티
- [x] `supabase/config.toml` — Edge Function 스케줄 설정 (`cleanup-deleted-albums`: 매일 02:00 UTC)
- [x] `supabase/migrations/0006_cron_cleanup.sql` — pg_cron 대체 스케줄 설정 (선택)

**Edge Function 환경 변수 등록 필요 (Supabase Dashboard → Edge Functions → Secrets):**
- `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 는 자동 주입)

---

> **✅ 화면 상태 명세(`travel-album-screen-states.md`) 갭 분석 및 보완 완료 (2026-06-14)**
> TODO-15-1 ~ 15-6 전체 완료. 나머지 P2 항목은 TODO-15-6 섹션 하단 참고.

---

### ✅ [TODO-15-1] 사진 삭제 & 용량 관리 (S-06 완성) — P0

> 완료: 2026-06-14

**사진 삭제**
- [x] `PhotoGrid`에서 본인 업로드 사진 길게 누르기(600ms) → 삭제 오버레이 → `deletePhoto` 호출
- [x] `deletePhoto` Server Action — DB 레코드 삭제 (RLS: 본인만), 트리거로 `storage_used_bytes` 차감
- [x] 데스크톱: 우클릭(onContextMenu) → 삭제 오버레이

**용량 게이지**
- [x] `MemoriesClient` 하단 고정 `StorageGauge` — "N.N GB / 5 GB" 진행 바
- [x] 80% 이상 경고 색상(amber), 100% 시 terracotta + 업로드 FAB 비활성

**파일 검증**
- [x] `PhotoUploadButton` — JPEG·PNG·WEBP·HEIC·HEIF 형식 + 20MB 이내 사전 검증
- [x] 용량 초과 응답 감지 → 토스트 "앨범 용량(5GB)이 가득 찼어요" + 루프 중단
- [x] 비지원/초과 파일 자동 제외 + 토스트 안내

---

### ✅ [TODO-15-2] 멤버 강퇴 & Co-host 지정 (S-10 완성) — P0

> 완료: 2026-06-14

- [x] `kickMember` Server Action — owner 전용, `album_members` 삭제
- [x] `updateMemberRole` Server Action — owner 전용, `co_host` ↔ `member` 전환
- [x] `MembersClient` 각 멤버 행에 역할 변경 버튼 + 강퇴 버튼 (owner만, 본인·방장 행 제외)
- [x] 강퇴 확인 모달 (바텀시트) — "강퇴된 멤버는 앨범에 접근할 수 없게 됩니다"
- [x] 강퇴/역할변경 처리 중 해당 행 `opacity: 0.5` 비활성
- [x] 새 초대 링크 발급 전 확인 모달 "기존 초대 링크는 즉시 사용할 수 없게 됩니다"
- [x] 초대 링크 유효기간 D-Day 형식으로 표시 (`differenceInCalendarDays`)

---

### ✅ [TODO-15-3] 홈 앨범 정렬 & 삭제 예정 배너 (S-03) — P0

> 완료: 2026-06-14

**홈 앨범 정렬**
- [x] `src/queries/albums.ts` `albumStatusRank()` 함수 추가 → 진행 중(0) → 예정(1) → 종료(2) 그룹 정렬, 그룹 내 최신순

**홈 삭제 예정 배너**
- [x] `AlbumCard` 상단 빨간 배너 + "N일 후 삭제 예정" (`delete_requested_at` + 7일 기준)

---

### ✅ [TODO-15-4] 날씨 위젯 (S-05) — P1

> 완료: 2026-06-14

- [x] `src/lib/weather/classify.ts` — WMO 5단계(0-4) → label·emoji 매핑 + `toWeatherStage()` 타입 가드
- [x] `src/queries/weather.ts` — `useWeather(albumId)` TanStack Query 훅 (fetch-weather Edge Function 호출, staleTime 6h, 실패 시 graceful empty)
- [x] `src/components/itinerary/WeatherWidget.tsx` — 최고/최저기온 + 5단계 아이콘(☀️⛅☁️🌧️❄️) 수평 스트립, 스켈레톤, 데이터 없으면 null 반환
- [x] `ItineraryClient.tsx` — DateBar 아래 WeatherWidget 통합

---

### ✅ [TODO-15-5] 사진 상세 뷰 (S-08 신규) — P1

> 완료: 2026-06-14

- [x] `src/app/albums/[albumId]/photos/[photoId]/page.tsx` — Server Component 래퍼
- [x] `PhotoDetailClient.tsx` — 풀스크린(fixed, 검정 배경) Next.js `<Image>`
- [x] 터치 스와이프(dx ≥ 60px) + 좌우 화살표 버튼으로 이전/다음 탐색 (`router.replace`)
- [x] 다운로드: `<a href={cdnUrl} download>` 버튼
- [x] 본인 업로드 사진: 삭제 버튼 → 확인 모달 → `deletePhoto` → memories 복귀
- [x] 페이지 인디케이터 (20장 이하: 점 목록, 초과: "N / total" 텍스트)
- [x] `PhotoGrid` 셀 탭 → `router.push` 상세 뷰 이동

---

### ✅ [TODO-15-6] 삭제 예정 배너·취소 & 초대 바텀시트 (P1) — 완료

> 완료: 2026-06-14

**앨범 삭제 예정 배너 (M-03) — P1**
- [x] `src/app/albums/[albumId]/layout.tsx` — `delete_requested_at` + 7일 기준 D-Day 계산, 상단 빨간 배너 렌더
- [x] `cancelAlbumDeletion` Server Action — `delete_requested_at = null` 업데이트 (`src/actions/album.ts`)
- [x] `AlbumSettingsForm` — 삭제 예정 중 재진입 시 "삭제 예약 취소" 버튼으로 전환
- [x] `/invite/[token]` — 삭제 예정 앨범 참여 차단 + "이 앨범은 곧 삭제될 예정이에요" 안내

**앨범 생성 후 초대 바텀시트 — P1**
- [x] `NewAlbumForm` 저장 성공 시 `generateInviteLink` 즉시 호출 → 초대 링크 바텀시트 자동 노출
- [x] 바텀시트: 링크 표시·복사 버튼(CheckIcon 전환) + "앨범으로 가기" 버튼

**커버·프로필 이미지 업로드 — P2 (완료 2026-06-14)**
- [x] `src/lib/image/resize.ts` — `resizeCover` (1280px), `resizeAvatar` (256px) 추가
- [x] `src/app/api/images/upload-url/route.ts` — 커버/아바타 presigned URL 발급 (인증만, 용량 미적용)
- [x] `src/components/ui/ImageUploadPicker.tsx` — cover/avatar 공용 피커 (resize → R2 PUT → CDN URL 반환)
- [x] `createAlbum` / `updateAlbum` — `coverImageUrl` 파라미터 추가
- [x] `createUserProfile` / `updateProfile` — `avatarUrl` FormData 필드 추가
- [x] `NewAlbumForm` / `AlbumSettingsForm` — `ImageUploadPicker` 폼 상단에 통합
- [x] `ProfileForm` (온보딩) — 아바타 피커 + Google OAuth 아바타 프리필 (`googleAvatarUrl` prop)
- [x] `ProfileSettingsForm` — 기존 정적 이미지를 클릭 가능한 `ImageUploadPicker`로 교체

**일기 임시 저장 (draft) — P2 (완료 2026-06-14)**
- [x] `DiaryEditForm` — `useEffect` + 1s debounce → `localStorage.setItem('draft:diary:{albumId}:{date}', content)`
- [x] 마운트 시 draft 감지 → Sonner toast "임시 저장된 일기가 있어요" + "불러오기" 액션 버튼
- [x] 저장/삭제 성공 시 draft 자동 제거

---

### [TODO-15-7] S-05·S-07 기획 업데이트 반영 (일정 탭 인터랙션 보완)

> S-05·S-07 기획 명세서 개정(2026-06-15) 으로 확인된 구현 갭

**S-05 일반 멤버 카드 탭 — 상세 팝업 (신규)**
- [ ] `src/components/itinerary/ItineraryItem.tsx` — 일반 멤버(`canEdit=false`)가 메모가 긴 카드를 탭 시 단순 상세 팝업 노출
  - 메모 표시: `line-clamp-2` 로 본문 잘림 처리 (짧으면 팝업 불필요)
  - 클릭 핸들러: 잘린 경우에만 팝업 open (장소명 + 시간 + 전체 메모 표시)
  - 팝업 구현: 기존 `dialog.tsx` (Base UI Dialog) 재사용, 읽기 전용

**S-05 Empty 상태 문구 수정**
- [ ] `src/app/albums/[albumId]/ItineraryClient.tsx` `EmptyItinerary` 컴포넌트
  - 현재: `"일정이 없어요"` → 스펙 기준: `"이 날의 일정이 없어요"`

---

### [TODO-16] 배포 & QA

> 선행 조건: 전체 완료 후

- [ ] `public/icons/` PNG 파일 추가 (192px, 512px, 512px maskable)
- [ ] Vercel 배포 (GitHub 연동, 환경변수 등록)
- [ ] 수동 테스트 시나리오 전체 실행 (`DEV_GUIDE.md` §9 체크리스트)
- [ ] Lighthouse 측정 (LCP < 2.5s, CLS < 0.1, JS < 200KB)

---

### [TODO-17] 여행기(Travel Diary) 기능

> 선행 조건: TODO-16 (배포 후 Post-MVP 1순위)
> 컨셉 문서: `travel-diary-feature-concept.md` | 형식: A안 (공유 URL 웹페이지)
> 정책: 멤버 누구나 생성·수정 / 사진 전부 자동 포함 / 앨범당 1개(덮어쓰기) / 링크 공개 / 탈퇴 멤버 콘텐츠 제외

**DB 마이그레이션**
- [ ] `supabase/migrations/0007_travel_diaries.sql` — `travel_diaries` 테이블 생성
  - 컬럼: `id`, `album_id`, `created_by`, `title`, `cover_photo_id`, `share_token` (unique), `is_published`, `created_at`, `updated_at`
  - RLS: 멤버 SELECT · 멤버 INSERT/UPDATE · owner만 DELETE
- [ ] `supabase gen types typescript --linked > src/types/database.ts` — 타입 재생성

**Server Action**
- [ ] `src/actions/diary.ts` — `generateDiary` Server Action
  - 멤버 누구나 호출 가능
  - 앨범당 1개 upsert (기존 여행기 덮어쓰기)
  - `is_active` 멤버의 콘텐츠만 포함 (탈퇴/강퇴 제외)
  - `share_token` 최초 생성 시 `crypto.randomUUID()` 발급, 이후 유지

**여행기 생성 UI (앨범 내)**
- [ ] 앨범 메뉴 또는 설정 화면에 "여행기 만들기" 버튼 추가 (멤버 전체 노출)
- [ ] 생성 완료 후 공유 URL 복사 버튼 + 여행기 바로가기 링크

**여행기 뷰 페이지 (공개, 로그인 불필요)**
- [ ] `src/app/diary/[token]/page.tsx` — Server Component, `share_token`으로 조회 (SSR)
  - 미발행(`is_published = false`) 또는 토큰 없음 → 404
- [ ] 표지 섹션: 앨범 제목 · 여행 기간 · 목적지 · 대표 사진 · 참여 멤버 닉네임
- [ ] 일자별 챕터: 날짜 헤더 + 일정 목록 + 사진 그리드 + 멤버별 감상문
- [ ] 마무리 섹션: 총 사진 수 · 방문 장소 수 · 멤버별 감상문 수

---

## ⚠️ 검증·확인 필요 항목 (개발 전)

- [ ] Kakao OAuth ↔ iOS Safari PWA 리다이렉트 실제 테스트
- [ ] 클라이언트 이미지 리사이즈 라이브러리 성능 (대용량 HEIC)
- [ ] Open-Meteo 미래 16일 초과 예보 처리 방식
- [ ] Cloudflare R2 사용량 알림 설정 (8 GB 도달 시)
- [ ] Supabase DB 사용량 알림 설정 (400 MB 도달 시)

---

## 🔮 Post-MVP 백로그

### 여행기(Travel Diary) Output 기능
> ✅ 정책 확정 완료 (2026-06-14) · **[TODO-17]로 구현 예정**
> 컨셉 문서: `travel-diary-feature-concept.md`

### 기타 백로그
- Kakao 로그인 (PWA/Safari 호환성 검증 후)
- 방장의 타인 부적절 사진 삭제 권한 (S-08 정책 보류분)
- 지도 핀 / AI 사진 태깅 / 댓글·리액션
- 동영상 지원 / 캘린더 연동 / 푸시 알림
- 앨범 외부 공개 공유 / 오프라인 동기화
