/**
 * 인앱 브라우저(임베디드 웹뷰) 감지 및 외부 브라우저 탈출 유틸.
 *
 * 구글 OAuth는 임베디드 웹뷰에서의 로그인을 정책적으로 차단한다
 * (403 disallowed_useragent). 카카오톡·네이버·인스타 등 인앱 브라우저를
 * 감지해서 기기 기본 브라우저로 유도하기 위한 순수 함수 모음.
 */

export type InAppBrowserApp =
  | 'kakaotalk'
  | 'naver'
  | 'instagram'
  | 'facebook'
  | 'line'
  | 'daum'
  | 'other'

export type MobileOS = 'ios' | 'android' | 'other'

export interface InAppBrowserInfo {
  isInApp: boolean
  app: InAppBrowserApp | null
  os: MobileOS
}

/**
 * User-Agent로 모바일 OS를 판별한다.
 *
 * @param userAgent navigator.userAgent 문자열
 * @returns 'ios' | 'android' | 'other'
 */
export function detectMobileOS(userAgent: string): MobileOS {
  const ua = userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  return 'other'
}

/**
 * User-Agent로 알려진 인앱 브라우저(임베디드 웹뷰)를 감지한다.
 *
 * @param userAgent navigator.userAgent 문자열
 * @returns 인앱 여부, 앱 종류, OS 정보
 */
export function detectInAppBrowser(userAgent: string): InAppBrowserInfo {
  const ua = userAgent
  const os = detectMobileOS(ua)
  let app: InAppBrowserApp | null = null

  if (/KAKAOTALK/i.test(ua)) app = 'kakaotalk'
  else if (/NAVER\(inapp/i.test(ua)) app = 'naver'
  else if (/Instagram/i.test(ua)) app = 'instagram'
  else if (/FBAN|FBAV|FB_IAB/i.test(ua)) app = 'facebook'
  else if (/Line\//i.test(ua)) app = 'line'
  else if (/DaumApps/i.test(ua)) app = 'daum'
  else if (/; wv\)/i.test(ua)) app = 'other' // 안드로이드 일반 WebView

  return { isInApp: app !== null, app, os }
}

/**
 * 인앱 브라우저에서 targetUrl을 기기 기본 브라우저로 여는 URL/스킴을 만든다.
 * 프로그래밍적으로 탈출이 불가능한 환경(예: iOS의 카카오톡 외 인앱 브라우저)에서는
 * null을 반환하며, 이 경우 사용자에게 수동 안내(Safari로 열기)를 보여줘야 한다.
 *
 * @param targetUrl 외부 브라우저에서 열고 싶은 절대 URL
 * @param info detectInAppBrowser 결과
 * @returns 탈출용 URL/스킴, 또는 자동 탈출이 불가능하면 null
 */
export function buildExternalBrowserEscape(
  targetUrl: string,
  info: InAppBrowserInfo,
): string | null {
  // 카카오톡: iOS/안드로이드 모두 기본 브라우저 열기 스킴 지원
  if (info.app === 'kakaotalk') {
    return `kakaotalk://web/openExternal?url=${encodeURIComponent(targetUrl)}`
  }

  // 라인: openExternalBrowser 쿼리 파라미터 지원
  if (info.app === 'line') {
    const sep = targetUrl.includes('?') ? '&' : '?'
    return `${targetUrl}${sep}openExternalBrowser=1`
  }

  // 안드로이드 일반: intent 스킴으로 크롬에 https URL을 강제로 넘긴다
  if (info.os === 'android') {
    const withoutScheme = targetUrl.replace(/^https?:\/\//, '')
    return `intent://${withoutScheme}#Intent;scheme=https;package=com.android.chrome;end`
  }

  // iOS(카카오톡 외) 인앱 브라우저는 강제 탈출 불가 → 수동 안내 필요
  return null
}
