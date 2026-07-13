import { NotFoundError } from "../../../shared/errors/AppError";
import type { SubjectRepository } from "../../subjects/domain/subject";
import type { StudyCycleRepository } from "../../study-cycles/domain/study-cycle";
import type {
  SessionWithSubject,
  StudyMethod,
  StudyPeriod,
  StudySessionRepository,
} from "../domain/study-session";

interface RegisterStudyInput {
  userId: string;
  subjectId: string;
  netMinutes: number;
  studyDate: Date;
  studyPeriod: StudyPeriod;
  studyMethod: StudyMethod;
  questionsCount?: number;
  correctCount?: number;
  pagesStudied?: number;
  notes?: string;
}

/**
 * Registra manualmente um estudo já concluído (sem cronômetro), criando uma
 * sessão FINISHED direto. Usado quando o usuário estudou fora do StudyBetter.
 */
export class RegisterStudyUseCase {
  constructor(
    private readonly sessions: StudySessionRepository,
    private readonly subjects: SubjectRepository,
    private readonly cycles: StudyCycleRepository,
  ) {}

  async execute({
    userId,
    subjectId,
    netMinutes,
    studyDate,
    studyPeriod,
    studyMethod,
    questionsCount,
    correctCount,
    pagesStudied,
    notes,
  }: RegisterStudyInput): Promise<SessionWithSubject> {
    const subject = await this.subjects.findById(userId, subjectId);
    if (!subject) {
      throw new NotFoundError("Matéria");
    }

    // Se a matéria pertence ao ciclo ativo, vincula a sessão a ele (para contar
    // no progresso da rodada). Não move o ponteiro: é um lançamento, não "estudar agora".
    const activeCycle = await this.cycles.findActiveByUser(userId);
    const cycleItem = activeCycle?.items.find(
      (item) => item.subjectId === subjectId,
    );

    // A data escolhida é a fonte da verdade: dashboard/streak/rodada usam endedAt.
    return this.sessions.createFinished({
      userId,
      subjectId,
      cycleId: cycleItem ? activeCycle!.id : null,
      startedAt: studyDate,
      endedAt: studyDate,
      accumulatedSeconds: netMinutes * 60,
      durationMinutes: netMinutes,
      studyMethod,
      studyPeriod,
      studyDate,
      ...(questionsCount !== undefined && { questionsCount }),
      ...(correctCount !== undefined && { correctCount }),
      ...(pagesStudied !== undefined && { pagesStudied }),
      ...(notes !== undefined && { notes }),
    });
  }
}
