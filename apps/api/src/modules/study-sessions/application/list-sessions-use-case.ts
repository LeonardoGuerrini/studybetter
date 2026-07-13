import type {
  SessionStatus,
  SessionWithSubject,
  StudySessionRepository,
} from "../domain/study-session";

interface ListSessionsInput {
  userId: string;
  page: number;
  pageSize: number;
  status?: SessionStatus;
}

interface ListSessionsOutput {
  items: SessionWithSubject[];
  total: number;
  page: number;
  pageSize: number;
}

export class ListSessionsUseCase {
  constructor(private readonly sessions: StudySessionRepository) {}

  async execute({
    userId,
    page,
    pageSize,
    status,
  }: ListSessionsInput): Promise<ListSessionsOutput> {
    const { items, total } = await this.sessions.listByUser(
      userId,
      page,
      pageSize,
      status,
    );
    return { items, total, page, pageSize };
  }
}
