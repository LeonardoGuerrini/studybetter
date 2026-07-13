import { ConflictError, NotFoundError } from "../../../shared/errors/AppError";
import { isUniqueViolation } from "../../../shared/utils/is-unique-violation";
import type { SubjectRepository } from "../../subjects/domain/subject";
import type { StudyCycleRepository } from "../../study-cycles/domain/study-cycle";
import type {
  SessionWithSubject,
  StudySessionRepository,
} from "../domain/study-session";

interface StartSessionInput {
  userId: string;
  subjectId: string;
}

export class StartSessionUseCase {
  constructor(
    private readonly sessions: StudySessionRepository,
    private readonly subjects: SubjectRepository,
    private readonly cycles: StudyCycleRepository,
  ) {}

  async execute({ userId, subjectId }: StartSessionInput): Promise<SessionWithSubject> {
    // As 3 leituras são independentes → uma única ida ao banco (paga ~1 RTT em
    // vez de 3 sequenciais; o pooler remoto do Supabase cobra latência por query).
    const [subject, openSession, activeCycle] = await Promise.all([
      this.subjects.findById(userId, subjectId),
      this.sessions.findOpenByUser(userId),
      this.cycles.findActiveByUser(userId),
    ]);

    if (!subject) {
      throw new NotFoundError("Matéria");
    }

    if (openSession) {
      throw new ConflictError(
        "Você já possui uma sessão de estudo em andamento. Finalize-a antes de iniciar outra.",
      );
    }

    // Se a matéria pertence ao ciclo ativo, vincula a sessão a ele e move o
    // ponteiro do ciclo para essa matéria (estudo pode ser em qualquer ordem).
    const cycleItem = activeCycle?.items.find(
      (item) => item.subjectId === subjectId,
    );
    if (activeCycle && cycleItem) {
      await this.cycles.updatePosition(activeCycle.id, cycleItem.position);
    }

    const now = new Date();
    try {
      return await this.sessions.create({
        userId,
        subjectId,
        cycleId: cycleItem ? activeCycle!.id : null,
        startedAt: now,
        lastResumedAt: now,
      });
    } catch (error) {
      // Corrida: outro request criou uma sessão aberta entre a checagem acima e
      // o create (barrado pelo índice único parcial). Traduz para 409 limpo.
      if (isUniqueViolation(error)) {
        throw new ConflictError(
          "Você já possui uma sessão de estudo em andamento. Finalize-a antes de iniciar outra.",
        );
      }
      throw error;
    }
  }
}
