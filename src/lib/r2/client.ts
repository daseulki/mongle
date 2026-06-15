import { S3Client } from '@aws-sdk/client-s3'

/**
 * S3-compatible R2 client for server-side use only (Route Handlers, Edge Functions).
 * Never import this in Client Components or pages.
 */
export function createR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    // AWS SDK v3는 기본적으로 CRC32 체크섬을 presigned URL에 포함시키는데,
    // 브라우저 PUT 시 빈 체크섬 값으로 서명되어 R2가 검증을 거부한다.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
}

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? 'mongle-trip'
