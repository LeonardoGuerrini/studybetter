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
    const cycle = await this.cycles.findActiveByUser(userId);
    if (!cycle) {
      return null;
    }
    const rows = await this.sessions.sumStudiedSecondsForCycleRound(cycle.id);
    const studiedBySubject = new Map(
      rows.map((row) => [row.subjectId, row.seconds]),
    );
    return { cycle, studiedBySubject };
  }
}
