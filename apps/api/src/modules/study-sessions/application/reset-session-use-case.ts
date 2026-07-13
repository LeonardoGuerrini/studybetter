import { NotFoundError } from "../../../shared/errors/AppError";
import { resetSession } from "../domain/session-lifecycle";
import type {
  SessionWithSubject,
  StudySessionRepository,
} from "../domain/study-session";

export class ResetSessionUseCase {
  constructor(private readonly sessions: StudySessionRepository) {}

  async execute(userId: string, sessionId: string): Promise<SessionWithSubject> {
    const session = await this.sessions.findById(userId, sessionId);
    if (!session) {
      throw new NotFoundError("Sessão de estudo");
    }
    return this.sessions.update(session.id, resetSession(session, new Date()));
  }
}
