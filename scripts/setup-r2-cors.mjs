/**
 * R2 CORS 설정 참고 파일
 *
 * R2의 CORS는 S3 API로 설정할 수 없으므로 아래 방법 중 하나를 사용하세요.
 *
 * ─── 방법 1: Cloudflare 대시보드 ──────────────────────────────────────────────
 * 1. https://dash.cloudflare.com → R2 Object Storage → mongle-trip 버킷 선택
 * 2. Settings 탭 → CORS Policy → Edit CORS Policy
 * 3. 아래 JSON 붙여넣기 후 Save
 *
 * ─── 방법 2: wrangler CLI ──────────────────────────────────────────────────────
 * 1. npm install -g wrangler  (또는 npx wrangler)
 * 2. wrangler login
 * 3. wrangler r2 bucket cors put mongle-trip --file scripts/cors.json
 *
 * ─── 적용할 CORS 규칙 (cors.json 과 동일) ──────────────────────────────────────
 * [
 *   {
 *     "AllowedOrigins": ["*"],
 *     "AllowedMethods": ["PUT", "GET"],
 *     "AllowedHeaders": ["Content-Type", "Content-Length"],
 *     "MaxAgeSeconds": 3600
 *   }
 * ]
 *
 * ※ PhotoUploadButton(사진 업로드)은 presigned URL 방식이므로
 *    반드시 R2 버킷에 위 CORS 규칙이 적용되어야 합니다.
 *
 * ※ ImageUploadPicker(커버/아바타)는 Next.js 서버 프록시 방식으로 변경되어
 *    CORS 설정 없이도 동작합니다.
 */
