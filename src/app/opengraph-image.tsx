import { ImageResponse } from 'next/og'

/**
 * 브랜드 OG 배너(1200x630)를 코드로 생성한다.
 *
 * ImageResponse(Satori)는 한글을 시스템 폰트로 렌더하지 못하므로 폰트 데이터를
 * 직접 주입해야 하고, WOFF2는 지원하지 않는다. 따라서 TTF(KyoboHandwriting2019)를
 * 사용한다. 에셋은 import.meta.url 기준 상대 경로로 fetch 해야 번들 트레이싱에 포함된다.
 */

export const alt = '몽글여행 — 가족·친구와 함께하는 여행 앨범 & 일정 앱'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image(): Promise<ImageResponse> {
  const [kyoboFont, mascotSvg] = await Promise.all([
    fetch(new URL('../../public/icons/KyoboHandwriting2019.ttf', import.meta.url)).then((res) =>
      res.arrayBuffer(),
    ),
    fetch(new URL('../../public/icons/mongle-mascot.svg', import.meta.url)).then((res) =>
      res.text(),
    ),
  ])

  const mascotDataUri = `data:image/svg+xml;base64,${Buffer.from(mascotSvg).toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FBF0DC 0%, #F5F0E8 50%, #E8C07A 135%)',
          fontFamily: 'Kyobo',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mascotDataUri} width={320} height={246} alt="" />
        <div style={{ display: 'flex', fontSize: 128, color: '#2C2416', marginTop: 8 }}>
          몽글여행
        </div>
        <div style={{ display: 'flex', fontSize: 46, color: '#5C4F3A', marginTop: 14 }}>
          {'가족·친구와 함께하는 여행 앨범 & 일정'}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 34,
            color: '#C4813A',
            marginTop: 22,
            letterSpacing: 3,
          }}
        >
          Mongle Trip
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Kyobo', data: kyoboFont, style: 'normal', weight: 400 }],
    },
  )
}
