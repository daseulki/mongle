/**
 * 몽글여행 브랜드 마크.
 *
 * SVG를 인라인으로 렌더해 페이지에 이미 로드된 next/font 변수(--font-kyobo)를
 * 텍스트에 적용한다. <img>로 불러온 SVG는 샌드박스되어 @font-face 외부 폰트를
 * 로드하지 못하므로(텍스트가 fallback으로 깨짐) 반드시 인라인으로 사용한다.
 */

type SvgProps = {
  className?: string
  style?: React.CSSProperties
}

/** 마스코트(몽글이) 도형 — BrandLogo와 MongleMascot가 공유 */
function MascotShapes(): React.JSX.Element {
  return (
    <>
      <text x="22" y="22" fill="#C4813A" style={{ font: 'bold 16px serif' }}>
        ✦
      </text>
      <text x="138" y="32" fill="#E8C07A" style={{ font: 'bold 12px serif' }}>
        ✧
      </text>

      <g transform="translate(140, 24) rotate(-12)">
        <path
          d="M 0 0 L 18 7 L 9 11 Z"
          fill="#F0C4A8"
          stroke="#5C4F3A"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M 0 0 L 9 11 L 18 7"
          fill="none"
          stroke="#5C4F3A"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>

      <ellipse cx="85" cy="128" rx="44" ry="4" fill="#5C4F3A" opacity="0.10" />

      <path
        d="M 40 108
           C 22 108 14 92 24 84
           C 14 76 18 60 32 60
           C 28 42 50 32 62 46
           C 68 30 92 30 100 46
           C 116 36 138 46 134 64
           C 150 68 148 88 132 90
           C 138 104 122 110 108 108
           Z"
        fill="#FFE4C7"
        stroke="#5C4F3A"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      <ellipse cx="56" cy="88" rx="6.5" ry="4" fill="#F4A48B" opacity="0.55" />
      <ellipse cx="108" cy="88" rx="6.5" ry="4" fill="#F4A48B" opacity="0.55" />

      <ellipse cx="68" cy="78" rx="3" ry="4" fill="#2C2416" />
      <ellipse cx="96" cy="78" rx="3" ry="4" fill="#2C2416" />
      <circle cx="69.2" cy="76.5" r="0.9" fill="#FFFFFF" />
      <circle cx="97.2" cy="76.5" r="0.9" fill="#FFFFFF" />

      <path
        d="M 74 92 Q 82 99 90 92"
        fill="none"
        stroke="#2C2416"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </>
  )
}

/** 마스코트 단독 (헤더 등 좁은 영역용). 장식 요소이므로 스크린리더에서 숨김. */
export function MongleMascot({ className, style }: SvgProps): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="10 2 152 134"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <MascotShapes />
    </svg>
  )
}

/** 풀 로고 (마스코트 + 몽글여행 워드마크 + Mongle Trip) — 히어로/스플래시용 */
export function BrandLogo({ className, style }: SvgProps): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 260"
      className={className}
      style={style}
      role="img"
      aria-label="몽글여행"
    >
      <g transform="translate(95, 20)">
        <MascotShapes />
      </g>

      <text
        x="160"
        y="210"
        textAnchor="middle"
        fill="#2C2416"
        style={{ fontFamily: 'var(--font-kyobo), cursive', fontSize: '56px' }}
      >
        몽글여행
      </text>

      <line x1="120" y1="226" x2="148" y2="226" stroke="#C4813A" strokeWidth="1.5" opacity="0.5" />
      <circle cx="160" cy="226" r="2.5" fill="#C4813A" />
      <line x1="172" y1="226" x2="200" y2="226" stroke="#C4813A" strokeWidth="1.5" opacity="0.5" />

      <text
        x="160"
        y="250"
        textAnchor="middle"
        fill="#C4813A"
        style={{ fontFamily: 'var(--font-kyobo), cursive', fontSize: '22px', letterSpacing: '1px' }}
      >
        Mongle Trip
      </text>
    </svg>
  )
}
