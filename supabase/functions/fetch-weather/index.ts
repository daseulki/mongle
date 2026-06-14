import { createClient } from 'jsr:@supabase/supabase-js@2'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { classifyWmo } from '../_shared/wmo.ts'

// ─── 타입 ────────────────────────────────────────────────────────────────────

interface OpenMeteoDaily {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
}

interface OpenMeteoResponse {
  daily: OpenMeteoDaily
}

interface WeatherRow {
  album_id: string
  date: string
  temp_max: number
  temp_min: number
  weather_code: number
  is_forecast: boolean
  fetched_at: string
}

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const current = new Date(startDate + 'T00:00:00Z')
  const end = new Date(endDate + 'T00:00:00Z')
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return dates
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

// ─── Open-Meteo 호출 ─────────────────────────────────────────────────────────

async function fetchForecast(lat: number, lng: number): Promise<OpenMeteoDaily> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min')
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('forecast_days', '16')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Forecast API error: ${res.status}`)
  const data = (await res.json()) as OpenMeteoResponse
  return data.daily
}

async function fetchArchive(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string,
): Promise<OpenMeteoDaily> {
  const url = new URL('https://archive-api.open-meteo.com/v1/archive')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min')
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('start_date', startDate)
  url.searchParams.set('end_date', endDate)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Archive API error: ${res.status}`)
  const data = (await res.json()) as OpenMeteoResponse
  return data.daily
}

// Open-Meteo Geocoding API
async function geocode(name: string): Promise<{ lat: number; lng: number } | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', name)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'ko')
  url.searchParams.set('format', 'json')

  const res = await fetch(url.toString())
  if (!res.ok) return null
  const data = (await res.json()) as { results?: { latitude: number; longitude: number }[] }
  if (!data.results?.length) return null
  return { lat: data.results[0].latitude, lng: data.results[0].longitude }
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ code: 'UNAUTHORIZED', message: '로그인이 필요합니다' }, 401)
  }

  // 사용자 컨텍스트 클라이언트 (RLS 적용)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  // 서비스 롤 클라이언트 (daily_weather upsert 용 — RLS 우회)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return jsonResponse({ code: 'UNAUTHORIZED', message: '인증에 실패했습니다' }, 401)
  }

  let body: { albumId?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ code: 'BAD_REQUEST', message: '요청 본문이 올바르지 않습니다' }, 400)
  }

  const { albumId } = body
  if (!albumId) {
    return jsonResponse({ code: 'BAD_REQUEST', message: 'albumId 가 필요합니다' }, 400)
  }

  // 멤버십 확인
  const { data: member } = await supabase
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) {
    return jsonResponse({ code: 'FORBIDDEN', message: '앨범 멤버가 아닙니다' }, 403)
  }

  // 앨범 정보 조회
  const { data: album } = await supabase
    .from('albums')
    .select('start_date, end_date, destination_lat, destination_lng, destination_name')
    .eq('id', albumId)
    .single()

  if (!album) {
    return jsonResponse({ code: 'NOT_FOUND', message: '앨범을 찾을 수 없습니다' }, 404)
  }

  let lat = album.destination_lat as number | null
  let lng = album.destination_lng as number | null

  // 좌표 없고 목적지 이름 있으면 지오코딩 시도
  if ((lat == null || lng == null) && album.destination_name) {
    const coords = await geocode(album.destination_name)
    if (coords) {
      lat = coords.lat
      lng = coords.lng
      // 앨범에 좌표 저장 (이후 호출에서 재지오코딩 방지)
      await supabaseAdmin
        .from('albums')
        .update({ destination_lat: lat, destination_lng: lng })
        .eq('id', albumId)
    }
  }

  // 좌표 없으면 날씨 기능 비활성화 (graceful)
  if (lat == null || lng == null) {
    return jsonResponse({ weather: [] })
  }

  const today = new Date().toISOString().split('T')[0]
  const maxForecastDate = addDays(today, 16)
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

  // 앨범 날짜 범위 안에서 조회 가능한 날짜 추출
  const allDates = getDatesInRange(album.start_date, album.end_date)

  // 기존 daily_weather 조회
  const { data: existing } = await supabaseAdmin
    .from('daily_weather')
    .select('date, is_forecast, fetched_at')
    .eq('album_id', albumId)

  const existingMap = new Map(
    (existing ?? []).map((r) => [r.date, r as { date: string; is_forecast: boolean; fetched_at: string }]),
  )

  // 갱신이 필요한 날짜 분류
  const pastDatesNeeded: string[] = []
  const forecastDatesNeeded: string[] = []

  for (const date of allDates) {
    const rec = existingMap.get(date)

    if (date < today) {
      // 과거 날짜: is_forecast=false로 확정된 것은 스킵
      if (rec && !rec.is_forecast) continue
      pastDatesNeeded.push(date)
    } else {
      // 오늘 + 미래: 16일 이내만
      if (date > maxForecastDate) continue
      // 6시간 이내에 fetch된 것은 스킵
      if (rec && rec.fetched_at > sixHoursAgo) continue
      forecastDatesNeeded.push(date)
    }
  }

  const now = new Date().toISOString()
  const rowsToUpsert: WeatherRow[] = []

  // 과거 날짜 → Archive API (배치 1회)
  if (pastDatesNeeded.length > 0) {
    const minDate = pastDatesNeeded[0]
    const maxDate = pastDatesNeeded[pastDatesNeeded.length - 1]

    try {
      const daily = await fetchArchive(lat, lng, minDate, maxDate)
      for (let i = 0; i < daily.time.length; i++) {
        const date = daily.time[i]
        if (!pastDatesNeeded.includes(date)) continue
        const tempMax = daily.temperature_2m_max[i]
        const tempMin = daily.temperature_2m_min[i]
        if (tempMax == null || tempMin == null) continue // 아직 아카이브에 없는 날짜
        rowsToUpsert.push({
          album_id: albumId,
          date,
          temp_max: tempMax,
          temp_min: tempMin,
          weather_code: classifyWmo(daily.weather_code[i]),
          is_forecast: false,
          fetched_at: now,
        })
      }
    } catch (err) {
      // 아카이브 API 실패 시 로그만 남기고 계속 (forecast로 대체 가능한 날짜는 아래에서 처리)
      console.error('[fetch-weather] archive fetch failed:', err)
    }
  }

  // 오늘 + 미래 날짜 → Forecast API (배치 1회)
  if (forecastDatesNeeded.length > 0) {
    try {
      const daily = await fetchForecast(lat, lng)
      for (let i = 0; i < daily.time.length; i++) {
        const date = daily.time[i]
        if (!forecastDatesNeeded.includes(date)) continue
        const tempMax = daily.temperature_2m_max[i]
        const tempMin = daily.temperature_2m_min[i]
        if (tempMax == null || tempMin == null) continue
        rowsToUpsert.push({
          album_id: albumId,
          date,
          temp_max: tempMax,
          temp_min: tempMin,
          weather_code: classifyWmo(daily.weather_code[i]),
          is_forecast: date > today,
          fetched_at: now,
        })
      }
    } catch (err) {
      console.error('[fetch-weather] forecast fetch failed:', err)
    }
  }

  // daily_weather upsert (service_role)
  if (rowsToUpsert.length > 0) {
    const { error: upsertError } = await supabaseAdmin
      .from('daily_weather')
      .upsert(rowsToUpsert, { onConflict: 'album_id,date' })

    if (upsertError) {
      console.error('[fetch-weather] upsert error:', upsertError)
    }
  }

  // 최신 전체 날씨 데이터 반환
  const { data: weather } = await supabaseAdmin
    .from('daily_weather')
    .select('date, temp_max, temp_min, weather_code, is_forecast, fetched_at')
    .eq('album_id', albumId)
    .order('date', { ascending: true })

  return jsonResponse({ weather: weather ?? [] })
})
