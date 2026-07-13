import type {
  SessionWithSubject,
  StudySessionRepository,
  SubjectTimeSummary,
} from "../../study-sessions/domain/study-session";
import { calculateStreak } from "../domain/calculate-streak";
import {
  startOfDay,
  startOfMonth,
  startOfWeek,
  toSaoPauloDayKey,
} from "../domain/date-ranges";

export interface DashboardSummary {
  totals: {
    todaySeconds: number;
    weekSeconds: number;
    monthSeconds: number;
    totalSeconds: number;
  };
  bySubject: SubjectTimeSummary[];
  lastSession: SessionWithSubject | null;
  streakDays: number;
  todaySessionsCount: number;
}

export class GetDashboardSummaryUseCase {
  constructor(private readonly sessions: StudySessionRepository) {}

  async execute(userId: string, now = new Date()): Promise<DashboardSummary> {
    const [totals, bySubject, lastSession, dayKeys] = await Promise.all([
      this.sessions.getFinishedTotals(
        userId,
        startOfDay(now),
        startOfWeek(now),
        startOfMonth(now),
      ),
      this.sessions.sumFinishedSecondsBySubject(userId),
      this.sessions.findLastFinished(userId),
      this.sessions.findFinishedDayKeys(userId),
    ]);

    return {
      totals: {
        todaySeconds: totals.today,
        weekSeconds: totals.week,
        monthSeconds: totals.month,
        totalSeconds: totals.total,
      },
      bySubject,
      lastSession,
      streakDays: calculateStreak(dayKeys, toSaoPauloDayKey(now)),
      todaySessionsCount: totals.todayCount,
    };
  }
}
