/**
 * Supabase + Cloudflare R2 연동 상태 확인 스크립트
 * 실행: node scripts/check-connections.mjs
 */
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── .env.local 파싱 ─────────────────────────────────────────────
function loadEnv(path) {
  try {
    const content = readFileSync(path, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      process.env[key] = val
    }
  } catch {
    console.warn('⚠️  .env.local 파일을 찾을 수 없어 환경변수에서 직접 읽습니다.\n')
  }
}
loadEnv(resolve(__dirname, '../.env.local'))

const REQUIRED_VARS = {
  Supabase: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
  'Cloudflare R2': [
    'R2_ENDPOINT',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'NEXT_PUBLIC_R2_PUBLIC_URL',
  ],
}

let allPassed = true

function pass(msg) { console.log(`  ✅ ${msg}`) }
function fail(msg) { console.log(`  ❌ ${msg}`); allPassed = false }
function info(msg) { console.log(`  ℹ️  ${msg}`) }
function section(title) { console.log(`\n──────────────────────────────\n${title}`) }

// ── 1. 환경변수 확인 ─────────────────────────────────────────────
section('1. 환경변수 확인')
for (const [service, vars] of Object.entries(REQUIRED_VARS)) {
  console.log(`\n  [${service}]`)
  for (const v of vars) {
    if (process.env[v]) {
      const masked = process.env[v].slice(0, 8) + '...'
      pass(`${v} = ${masked}`)
    } else {
      fail(`${v} — 설정되지 않음`)
    }
  }
}

// ── 2. Supabase 연결 테스트 ──────────────────────────────────────
section('2. Supabase 연결 테스트')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

try {
  // 2-1. REST API 헬스체크
  const healthRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  })
  if (healthRes.ok || healthRes.status === 200) {
    pass(`REST API 응답 정상 (${healthRes.status})`)
  } else {
    fail(`REST API 응답 이상 (${healthRes.status})`)
    const body = await healthRes.text()
    info(body.slice(0, 200))
  }

  // 2-2. DB 쿼리 테스트 — users 테이블 존재 확인
  const queryRes = await fetch(`${SUPABASE_URL}/rest/v1/users?limit=1`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  })
  if (queryRes.ok) {
    const rows = await queryRes.json()
    pass(`users 테이블 쿼리 성공 (현재 사용자 수: ${Array.isArray(rows) ? rows.length : '?'}건 샘플)`)
  } else {
    const body = await queryRes.json()
    fail(`users 테이블 쿼리 실패: ${body.message ?? JSON.stringify(body)}`)
  }

  // 2-3. albums 테이블 존재 확인
  const albumsRes = await fetch(`${SUPABASE_URL}/rest/v1/albums?limit=1`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  })
  if (albumsRes.ok) {
    pass('albums 테이블 쿼리 성공')
  } else {
    const body = await albumsRes.json()
    fail(`albums 테이블 쿼리 실패: ${body.message ?? JSON.stringify(body)}`)
  }

  // 2-4. Auth 서비스 확인
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  })
  if (authRes.ok) {
    const settings = await authRes.json()
    pass(`Auth 서비스 정상 (이메일 인증: ${settings.external?.email ? '활성화' : '비활성화'})`)
  } else {
    fail(`Auth 서비스 응답 이상 (${authRes.status})`)
  }
} catch (err) {
  fail(`Supabase 연결 오류: ${err.message}`)
  info('NEXT_PUBLIC_SUPABASE_URL이 올바른지 확인하세요')
}

// ── 3. Cloudflare R2 연결 테스트 ────────────────────────────────
section('3. Cloudflare R2 연결 테스트')

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand } =
  await import('@aws-sdk/client-s3')
const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

const BUCKET = process.env.R2_BUCKET_NAME
const TEST_KEY = `_connection-test/${Date.now()}.txt`
const TEST_BODY = 'mongle-trip connection test'

try {
  // 3-1. 버킷 존재 확인
  await r2.send(new HeadBucketCommand({ Bucket: BUCKET }))
  pass(`버킷 "${BUCKET}" 접근 가능`)
} catch (err) {
  fail(`버킷 접근 실패: ${err.message}`)
  info('R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY를 확인하세요')
}

try {
  // 3-2. 객체 업로드
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: TEST_KEY,
    Body: TEST_BODY,
    ContentType: 'text/plain',
  }))
  pass(`테스트 파일 업로드 성공 (${TEST_KEY})`)

  // 3-3. Presigned URL 생성
  const presignedUrl = await getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: TEST_KEY }),
    { expiresIn: 60 },
  )
  pass('Presigned URL 생성 성공')
  info(`URL 샘플: ${presignedUrl.slice(0, 80)}...`)

  // 3-4. 공개 URL 접근 가능 여부
  const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${TEST_KEY}`
  const pubRes = await fetch(publicUrl)
  if (pubRes.ok) {
    const text = await pubRes.text()
    if (text === TEST_BODY) {
      pass(`공개 URL(CDN) 접근 성공: ${publicUrl.split('/').slice(0, 3).join('/')}`)
    } else {
      fail(`공개 URL 응답 내용 불일치: "${text.slice(0, 50)}"`)
    }
  } else {
    fail(`공개 URL 접근 실패 (${pubRes.status}) — R2 버킷이 Public으로 설정되어 있는지 확인하세요`)
    info(`시도한 URL: ${publicUrl}`)
  }

  // 3-5. 테스트 파일 삭제
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: TEST_KEY }))
  pass('테스트 파일 삭제 완료')
} catch (err) {
  fail(`R2 작업 중 오류: ${err.message}`)
}

// ── 결과 요약 ────────────────────────────────────────────────────
section('결과 요약')
if (allPassed) {
  console.log('\n🎉 모든 연결이 정상입니다!\n')
} else {
  console.log('\n⚠️  일부 항목에서 문제가 발견됐습니다. 위 ❌ 항목을 확인하세요.\n')
}
