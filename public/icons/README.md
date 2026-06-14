# 몽글여행 로고 패키지

## 파일 목록

- `mongle-mascot.svg` — 몽글이 마스코트 캐릭터 (단독)
- `mongle-logo-primary.svg` — 메인 로고 (마스코트 + 워드마크)
- `mongle-icon-app.svg` — 앱 스토어 아이콘 (1024×1024)
- `KyoboHandwriting-subset.woff2` — 서브셋 폰트 (7.5KB, 웹용)
- `KyoboHandwriting2019.ttf` — 원본 폰트 (7.4MB, 디자인 작업용)

## 사용법

### 웹앱에 폰트 적용 (서브셋 사용 권장)

```css
@font-face {
  font-family: 'KyoboHand';
  src: url('/fonts/KyoboHandwriting-subset.woff2') format('woff2');
  font-display: swap;
}

.wordmark {
  font-family: 'KyoboHand', cursive;
}
```

### 추가 글자가 필요하면 다시 서브셋

```bash
pyftsubset KyoboHandwriting2019.ttf \
  --text="몽글여행Mongle Trip추가할글자" \
  --output-file=output.woff2 \
  --flavor=woff2
```

## 컬러 토큰 (마스코트 기준)

- 마스코트 body: `#FFE4C7`
- 외곽선: `#5C4F3A`
- 볼터치: `#F4A48B` (opacity 0.55)
- 눈동자: `#2C2416`
- 워드마크: `#2C2416` (라이트) / `#FFE4C7` (다크)
- 영문 색상: `#C4813A`

## 파일 크기 비교

| 파일 | 크기 | 용도 |
|---|---|---|
| TTF 원본 | 7.4 MB | 디자인 툴(Figma, PS)용 |
| WOFF2 서브셋 | 7.5 KB | 웹앱 배포용 |
