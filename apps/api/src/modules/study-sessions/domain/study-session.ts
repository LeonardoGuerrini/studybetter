export type SessionStatus = "RUNNING" | "PAUSED" | "FINISHED";

export type StudyMethod =
  | "PDF"
  | "QUESTIONS"
  | "VIDEO"
  | "PDF_QUESTIONS"
  | "REVIEW"
  | "MIND_MAP"
  | "FLASH_CARDS";

export type StudyPeriod = "MORNING" | "AFTERNOON" | "EVENING" | "DAWN";

export interface StudySession {
  id: string;
  userId: string;
  subjectId: string;
  cycleId: string | null;
  status: SessionStatus;
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number | null;
  accumulatedSeconds: number;
  lastResumedAt: Date | null;
  notes: string | null;
  studyMethod: StudyMethod | null;
  studyPeriod: StudyPeriod | null;
  studyDate: Date | null;
  questionsCount: number | null;
  correctCount: number | null;
  pagesStudied: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionSubjectInfo {
  id: string;
  name: string;
  color: string;
}

export interface SessionWithSubject extends StudySession {
  subject: SessionSubjectInfo;
  cycle: { name: string } | null;
}

/** Tempo estudado (segundos) por matéria na rodada corrente de um ciclo. */
export interface CycleSubjectSeconds {
  subjectId: string;
  seconds: number;
}

/** Totais de tempo finalizado do dashboard, agregados numa query só. */
export interface FinishedTotals {
  today: number;
  week: number;
  month: number;
  total: number;
  todayCount: number;
}

export interface SubjectTimeSummary {
  subjectId: string;
  name: string;
  color: string;
  /** Tempo estudado real em segundos (soma de `accumulatedSeconds`). */
  seconds: number;
}

export interface CreateSessionData {
  userId: string;
  subjectId: string;
  cycleId: string | null;
  startedAt: Date;
  lastResumedAt: Date;
}

/** Dados para criar uma sessão já finalizada (registro manual, sem cronômetro). */
export interface CreateFinishedSessionData {
  userId: string;
  subjectId: string;
  cycleId: string | null;
  startedAt: Date;
  endedAt: Date;
  accumulatedSeconds: number;
  durationMinutes: number;
  studyMethod: StudyMethod;
  studyPeriod: StudyPeriod;
  studyDate: Date;
  questionsCount?: number;
  correctCount?: number;
  pagesStudied?: number;
  notes?: string;
}

export interface UpdateSessionData {
  status?: SessionStatus;
  endedAt?: Date;
  durationMinutes?: number;
  accumulatedSeconds?: number;
  lastResumedAt?: Date | null;
  notes?: string;
  studyMethod?: StudyMethod;
  studyPeriod?: StudyPeriod;
  studyDate?: Date;
  questionsCount?: number;
  correctCount?: number;
  pagesStudied?: number;
}

export interface StudySessionRepository {
  create(data: CreateSessionData): Promise<SessionWithSubject>;
  createFinished(data: CreateFinishedSessionData): Promise<SessionWithSubject>;
  update(id: string, data: UpdateSessionData): Promise<SessionWithSubject>;
  findById(userId: string, id: string): Promise<StudySession | null>;
  findOpenByUser(userId: string): Promise<SessionWithSubject | null>;
  listByUser(
    userId: string,
    page: number,
    pageSize: number,
    status?: SessionStatus,
  ): Promise<{ items: SessionWithSubject[]; total: number }>;
  /** Totais hoje/semana/mês/total + contagem de hoje numa única query. */
  getFinishedTotals(
    userId: string,
    day: Date,
    week: Date,
    month: Date,
  ): Promise<FinishedTotals>;
  sumFinishedSecondsBySubject(userId: string): Promise<SubjectTimeSummary[]>;
  findLastFinished(userId: string): Promise<SessionWithSubject | null>;
  /** Dias distintos (YYYY-MM-DD, fuso America/Sao_Paulo) com sessão finalizada, desc. */
  findFinishedDayKeys(userId: string): Promise<string[]>;
  /** Segundos estudados por matéria na rodada corrente (respeita roundStartedAt por matéria). */
  sumStudiedSecondsForCycleRound(
    cycleId: string,
  ): Promise<CycleSubjectSeconds[]>;
}
