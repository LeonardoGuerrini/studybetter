import { ConflictError } from "../../../shared/errors/AppError";
import type { SessionStatus, StudySession } from "./study-session";

type TimeTracking = Pick<StudySession, "accumulatedSeconds" | "lastResumedAt">;

/** Segundos estudados até `now`, somando trechos pausados + trecho corrente. */
export function elapsedSeconds(session: TimeTracking, now: Date): number {
  const currentStretch = session.lastResumedAt
    ? Math.max(0, Math.floor((now.getTime() - session.lastResumedAt.getTime()) / 1000))
    : 0;
  return session.accumulatedSeconds + currentStretch;
}

export interface PauseResult {
  status: Extract<SessionStatus, "PAUSED">;
  accumulatedSeconds: number;
  lastResumedAt: null;
}

export function pauseSession(session: StudySession, now: Date): PauseResult {
  if (session.status !== "RUNNING") {
    throw new ConflictError("Apenas sessões em andamento podem ser pausadas");
  }
  return {
    status: "PAUSED",
    accumulatedSeconds: elapsedSeconds(session, now),
    lastResumedAt: null,
  };
}

export interface ResumeResult {
  status: Extract<SessionStatus, "RUNNING">;
  lastResumedAt: Date;
}

export function resumeSession(session: StudySession, now: Date): ResumeResult {
  if (session.status !== "PAUSED") {
    throw new ConflictError("Apenas sessões pausadas podem ser retomadas");
  }
  return { status: "RUNNING", lastResumedAt: now };
}

export interface ResetResult {
  status: Extract<SessionStatus, "PAUSED">;
  accumulatedSeconds: number;
  lastResumedAt: null;
}

/** Zera o cronômetro de uma sessão aberta e a deixa PAUSADA (não volta contando). */
export function resetSession(session: StudySession, _now: Date): ResetResult {
  if (session.status === "FINISHED") {
    throw new ConflictError("Não é possível reiniciar uma sessão finalizada");
  }
  return {
    status: "PAUSED",
    accumulatedSeconds: 0,
    lastResumedAt: null,
  };
}

export interface FinishResult {
  status: Extract<SessionStatus, "FINISHED">;
  accumulatedSeconds: number;
  lastResumedAt: null;
  endedAt: Date;
  durationMinutes: number;
}

export function finishSession(session: StudySession, now: Date): FinishResult {
  if (session.status === "FINISHED") {
    throw new ConflictError("A sessão já foi finalizada");
  }
  const totalSeconds = elapsedSeconds(session, now);
  return {
    status: "FINISHED",
    accumulatedSeconds: totalSeconds,
    lastResumedAt: null,
    endedAt: now,
    durationMinutes: Math.round(totalSeconds / 60),
  };
}
