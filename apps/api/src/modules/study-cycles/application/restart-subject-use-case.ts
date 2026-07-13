import { NotFoundError } from "../../../shared/errors/AppError";
import type { StudySessionRepository } from "../../study-sessions/domain/study-session";
import type { StudyCycleRepository } from "../domain/study-cycle";

interface RestartSubjectInput {
  userId: string;
  subjectId: string;
  mode: "save" | "discard";
}

/**
 * Reinicia o tempo da rodada de uma matéria no ciclo ativo.
 * - save: arquiva o tempo estudado antes de zerar.
 * - discard: apenas zera o contador (sessões/anotações permanecem).
 */
export class RestartSubjectUseCase {
  constructor(
    private readonly cycles: StudyCycleRepository,
    private readonly sessions: StudySessionRepository,
  ) {}

  async execute({ userId, subjectId, mode }: RestartSubjectInput): Promise<void> {
    const cycle = await this.cycles.findActiveByUser(userId);
    if (!cycle) {
      throw new NotFoundError("Ciclo de estudos ativo");
    }
    const item = cycle.items.find((entry) => entry.subjectId === subjectId);
    if (!item) {
      throw new NotFoundError("Matéria do ciclo");
    }

    if (mode === "save") {
      const rows = await this.sessions.sumStudiedSecondsForCycleRound(cycle.id);
      const studied = rows.find((row) => row.subjectId === subjectId)?.seconds;
      if (studied && studied > 0) {
        await this.cycles.archiveRound([
          {
            cycleId: cycle.id,
            subjectId,
            subjectName: item.subject.name,
            studiedSeconds: studied,
            kind: "SUBJECT_SAVE",
          },
        ]);
      }
    }

    await this.cycles.resetItemRound(cycle.id, subjectId, new Date());
  }
}
