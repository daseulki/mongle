/**
 * Maps a 5-stage weather classification (stored in DB as 0-4) to display metadata.
 *
 * Stage values:
 *   0 → 맑음       (☀️)
 *   1 → 구름 조금  (⛅)
 *   2 → 흐림       (☁️)
 *   3 → 비         (🌧️)
 *   4 → 눈         (❄️)
 */
export type WeatherStage = 0 | 1 | 2 | 3 | 4

export type WeatherMeta = {
  label: string
  emoji: string
}

const STAGE_META: Record<WeatherStage, WeatherMeta> = {
  0: { label: '맑음', emoji: '☀️' },
  1: { label: '구름 조금', emoji: '⛅' },
  2: { label: '흐림', emoji: '☁️' },
  3: { label: '비', emoji: '🌧️' },
  4: { label: '눈', emoji: '❄️' },
}

/**
 * @param stage 0-4 weather stage from DB
 * @returns display label and emoji for the given stage
 */
export function getWeatherMeta(stage: WeatherStage): WeatherMeta {
  return STAGE_META[stage] ?? STAGE_META[2]
}

/**
 * Narrows an unknown number to a WeatherStage.
 */
export function toWeatherStage(n: number): WeatherStage {
  if (n === 0 || n === 1 || n === 2 || n === 3 || n === 4) return n
  return 2
}
