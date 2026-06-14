/**
 * Classifies an Open-Meteo WMO weather code into 5 stages.
 *
 * PRD §2.11 매핑:
 *   0 → 맑음       (WMO 0)
 *   1 → 구름 조금  (WMO 1, 2)
 *   2 → 흐림       (WMO 3, 45, 48)
 *   3 → 비         (WMO 51-67, 80-82, 95-99)
 *   4 → 눈         (WMO 71-77, 85-86)
 */
export function classifyWmo(code: number): 0 | 1 | 2 | 3 | 4 {
  if (code === 0) return 0
  if (code === 1 || code === 2) return 1
  if (code === 3 || code === 45 || code === 48) return 2
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99)
  ) return 3
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 4
  return 2 // unknown WMO code → 흐림 (safe fallback)
}
