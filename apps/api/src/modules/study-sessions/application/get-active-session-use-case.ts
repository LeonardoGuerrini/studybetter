import type {
  SessionWithSubject,
  StudySessionRepository,
} from "../domain/study-session";

export class GetActiveSessionUseCase {
  constructor(private readonly sessions: StudySessionRepository) {}

  execute(userId: string): Promise<SessionWithSubject | null> {
    return this.sessions.findOpenByUser(userId);
  }
}
