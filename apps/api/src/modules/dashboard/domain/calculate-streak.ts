import { prevDayKey } from "./date-ranges";

/**
 * Streak = dias consecutivos com ao menos uma sessão finalizada, contando a partir
 * de hoje (ou de ontem, se hoje ainda não houve estudo). Recebe as chaves de dia
 * (YYYY-MM-DD, já no fuso desejado) e a chave de "hoje" no mesmo fuso.
 */
export function calculateStreak(dayKeys: string[], todayKey: string): number {
  if (dayKeys.length === 0) {
    return 0;
  }

  const studiedDays = new Set(dayKeys);

  let cursor = todayKey;
  if (!studiedDays.has(cursor)) {
    cursor = prevDayKey(cursor);
  }

  let streak = 0;
  while (studiedDays.has(cursor)) {
    streak += 1;
    cursor = prevDayKey(cursor);
  }
  return streak;
}
