/**
 * O cálculo do tempo estudado por matéria na rodada (respeitando o `roundStartedAt`
 * de cada matéria) agora é feito no banco, via
 * `StudySessionRepository.sumStudiedSecondsForCycleRound` — evita trazer todas as
 * sessões para agregar em memória.
 */

/** Uma matéria está concluída quando o tempo estudado alcança o planejado. */
export function isConcluded(
  studiedSeconds: number,
  plannedMinutes: number,
): boolean {
  return studiedSeconds >= plannedMinutes * 60;
}
