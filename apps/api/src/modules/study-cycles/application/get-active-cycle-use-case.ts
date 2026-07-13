import type { StudySessionRepository } from "../../study-sessions/domain/study-session";
import type {
  StudyCycleRepository,
  StudyCycleWithItems,
} from "../domain/study-cycle";

export interface ActiveCycleView {
  cycle: StudyCycleWithItems;
  studiedBySubject: Map<string, number>;
}

export class GetActiveCycleUseCase {
  constructor(
    private readonly cycles: StudyCycleRepository,
    private readonly sessions: StudySessionRepository,
  ) {}

  async execute(userId: string): Promise<ActiveCycleView | null> {
    // Duas leituras independentes (a soma resolve o ciclo ativo na própria
    // query) → Promise.all evita o RTT sequencial ao banco. Relevante quando
    // API e banco estão longe (cada round-trip custa caro).
    const [cycle, rows] = await Promise.all([
      this.cycles.findActiveByUser(userId),
      this.sessions.sumStudiedSecondsForActiveCycleRound(userId),
    ]);
    if (!cycle) {
      return null;
    }
    const studiedBySubject = new Map(
      rows.map((row) => [row.subjectId, row.seconds]),
    );
    return { cycle, studiedBySubject };
  }
}
