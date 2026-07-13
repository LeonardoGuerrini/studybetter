import { NotFoundError } from "../../../shared/errors/AppError";
import type { StudySessionRepository } from "../../study-sessions/domain/study-session";
import type {
  RoundArchiveEntry,
  StudyCycleRepository,
} from "../domain/study-cycle";

/**
 * Reinicia o ciclo ativo: arquiva o tempo estudado da rodada, zera os
 * contadores (novo roundStartedAt) e volta a posição ao início.
 * As sessões e anotações permanecem intactas.
 */
export class RestartCycleUseCase {
  constructor(
    private readonly cycles: StudyCycleRepository,
    private readonly sessions: StudySessionRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    const cycle = await this.cycles.findActiveByUser(userId);
    if (!cycle) {
      throw new NotFoundError("Ciclo de estudos ativo");
    }

    const rows = await this.sessions.sumStudiedSecondsForCycleRound(cycle.id);
    const studied = new Map(rows.map((row) => [row.subjectId, row.seconds]));

    const entries: RoundArchiveEntry[] = cycle.items
      .map((item) => ({
        cycleId: cycle.id,
        subjectId: item.subjectId,
        subjectName: item.subject.name,
        studiedSeconds: studied.get(item.subjectId) ?? 0,
        kind: "CYCLE_RESET" as const,
      }))
      .filter((entry) => entry.studiedSeconds > 0);

    await this.cycles.archiveRound(entries);
    await this.cycles.resetRound(cycle.id, new Date());
    await this.cycles.updatePosition(cycle.id, 0);
  }
}
