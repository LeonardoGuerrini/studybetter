import { NotFoundError } from "../../../shared/errors/AppError";
import { finishSession } from "../domain/session-lifecycle";
import type {
  SessionWithSubject,
  StudyMethod,
  StudyPeriod,
  StudySessionRepository,
} from "../domain/study-session";

interface FinishSessionInput {
  userId: string;
  sessionId: string;
  netMinutes: number;
  studyDate: Date;
  studyPeriod: StudyPeriod;
  studyMethod: StudyMethod;
  questionsCount?: number;
  correctCount?: number;
  pagesStudied?: number;
  notes?: string;
}

export class FinishSessionUseCase {
  constructor(private readonly sessions: StudySessionRepository) {}

  async execute({
    userId,
    sessionId,
    netMinutes,
    studyDate,
    studyPeriod,
    studyMethod,
    questionsCount,
    correctCount,
    pagesStudied,
    notes,
  }: FinishSessionInput): Promise<SessionWithSubject> {
    const session = await this.sessions.findById(userId, sessionId);
    if (!session) {
      throw new NotFoundError("Sessão de estudo");
    }
    // O tempo líquido informado pelo usuário é a fonte da verdade: sobrescreve
    // o tempo cronometrado (accumulatedSeconds/durationMinutes), que alimenta
    // dashboard e progresso do ciclo.
    return this.sessions.update(session.id, {
      ...finishSession(session, new Date()),
      accumulatedSeconds: netMinutes * 60,
      durationMinutes: netMinutes,
      studyDate,
      studyPeriod,
      studyMethod,
      ...(questionsCount !== undefined && { questionsCount }),
      ...(correctCount !== undefined && { correctCount }),
      ...(pagesStudied !== undefined && { pagesStudied }),
      ...(notes !== undefined && { notes }),
    });
  }
}
