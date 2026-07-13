import { elapsedSeconds } from "../domain/session-lifecycle";
import type { SessionWithSubject } from "../domain/study-session";

/** DTO de resposta: expõe o tempo decorrido calculado no servidor. */
export function toSessionResponse(session: SessionWithSubject, now = new Date()) {
  return {
    id: session.id,
    subjectId: session.subjectId,
    subject: session.subject,
    cycleId: session.cycleId,
    cycleName: session.cycle?.name ?? null,
    status: session.status,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationMinutes: session.durationMinutes,
    accumulatedSeconds: session.accumulatedSeconds,
    lastResumedAt: session.lastResumedAt,
    elapsedSeconds: elapsedSeconds(session, now),
    notes: session.notes,
    studyMethod: session.studyMethod,
    studyPeriod: session.studyPeriod,
    studyDate: session.studyDate,
    questionsCount: session.questionsCount,
    correctCount: session.correctCount,
    pagesStudied: session.pagesStudied,
  };
}
