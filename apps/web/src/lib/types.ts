export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface SubjectInfo {
  id: string;
  name: string;
  color: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  subject: SubjectInfo;
  cycleId: string | null;
  cycleName: string | null;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  accumulatedSeconds: number;
  lastResumedAt: string | null;
  elapsedSeconds: number;
  notes: string | null;
  studyMethod: StudyMethod | null;
  studyPeriod: StudyPeriod | null;
  studyDate: string | null;
  questionsCount: number | null;
  correctCount: number | null;
  pagesStudied: number | null;
}

export interface CycleItem {
  id: string;
  cycleId: string;
  subjectId: string;
  position: number;
  plannedMinutes: number;
  weight: number;
  knowledgeLevel: number;
  priorityScore: number;
  isActive: boolean;
  subject: SubjectInfo;
}

export interface StudyCycle {
  id: string;
  name: string;
  currentPosition: number;
  isActive: boolean;
  createdAt: string;
  items: CycleItem[];
  currentItem: CycleItem | null;
}

/** Item do ciclo ativo, com o tempo estudado na rodada. */
export interface ActiveCycleItem extends CycleItem {
  studiedSeconds: number;
  concluded: boolean;
}

export interface ActiveCycle {
  id: string;
  name: string;
  currentPosition: number;
  isActive: boolean;
  createdAt: string;
  items: ActiveCycleItem[];
  currentItem: CycleItem | null;
  totalStudiedSeconds: number;
  totalPlannedSeconds: number;
}

export interface CycleSegment {
  color: string;
  plannedMinutes: number;
}

export interface CycleSummary {
  id: string;
  name: string;
  isActive: boolean;
  itemCount: number;
  totalPlannedMinutes: number;
  segments: CycleSegment[];
  createdAt: string;
}

export interface SubjectTimeSummary {
  subjectId: string;
  name: string;
  color: string;
  seconds: number;
}

export interface DashboardSummary {
  totals: {
    todaySeconds: number;
    weekSeconds: number;
    monthSeconds: number;
    totalSeconds: number;
  };
  bySubject: SubjectTimeSummary[];
  lastSession: StudySession | null;
  streakDays: number;
  todaySessionsCount: number;
}
