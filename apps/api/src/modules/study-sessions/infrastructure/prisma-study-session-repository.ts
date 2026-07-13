import { prisma } from "../../../infrastructure/database/prisma";
import type {
  CreateFinishedSessionData,
  CreateSessionData,
  CycleSubjectSeconds,
  FinishedTotals,
  SessionStatus,
  SessionWithSubject,
  StudySession,
  StudySessionRepository,
  SubjectTimeSummary,
  UpdateSessionData,
} from "../domain/study-session";

const SUBJECT_SELECT = {
  subject: { select: { id: true, name: true, color: true } },
  cycle: { select: { name: true } },
} as const;

export class PrismaStudySessionRepository implements StudySessionRepository {
  create(data: CreateSessionData): Promise<SessionWithSubject> {
    return prisma.studySession.create({
      data,
      include: SUBJECT_SELECT,
    });
  }

  createFinished(
    data: CreateFinishedSessionData,
  ): Promise<SessionWithSubject> {
    return prisma.studySession.create({
      data: { ...data, status: "FINISHED", lastResumedAt: null },
      include: SUBJECT_SELECT,
    });
  }

  update(id: string, data: UpdateSessionData): Promise<SessionWithSubject> {
    return prisma.studySession.update({
      where: { id },
      data,
      include: SUBJECT_SELECT,
    });
  }

  findById(userId: string, id: string): Promise<StudySession | null> {
    return prisma.studySession.findFirst({ where: { id, userId } });
  }

  findOpenByUser(userId: string): Promise<SessionWithSubject | null> {
    return prisma.studySession.findFirst({
      where: { userId, status: { in: ["RUNNING", "PAUSED"] } },
      include: SUBJECT_SELECT,
      orderBy: { startedAt: "desc" },
    });
  }

  async listByUser(
    userId: string,
    page: number,
    pageSize: number,
    status?: SessionStatus,
  ): Promise<{ items: SessionWithSubject[]; total: number }> {
    const where = { userId, ...(status && { status }) };
    const [items, total] = await Promise.all([
      prisma.studySession.findMany({
        where,
        include: SUBJECT_SELECT,
        orderBy: { startedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.studySession.count({ where }),
    ]);
    return { items, total };
  }

  async getFinishedTotals(
    userId: string,
    day: Date,
    week: Date,
    month: Date,
  ): Promise<FinishedTotals> {
    const rows = await prisma.$queryRaw<
      {
        today: number;
        week: number;
        month: number;
        total: number;
        today_count: number;
      }[]
    >`
      SELECT
        COALESCE(SUM("accumulatedSeconds") FILTER (WHERE "endedAt" >= ${day}), 0)::int   AS today,
        COALESCE(SUM("accumulatedSeconds") FILTER (WHERE "endedAt" >= ${week}), 0)::int  AS week,
        COALESCE(SUM("accumulatedSeconds") FILTER (WHERE "endedAt" >= ${month}), 0)::int AS month,
        COALESCE(SUM("accumulatedSeconds"), 0)::int                                      AS total,
        COUNT(*) FILTER (WHERE "endedAt" >= ${day})::int                                 AS today_count
      FROM study_sessions
      WHERE "userId" = ${userId} AND status = 'FINISHED'
    `;
    const row = rows[0];
    return {
      today: row?.today ?? 0,
      week: row?.week ?? 0,
      month: row?.month ?? 0,
      total: row?.total ?? 0,
      todayCount: row?.today_count ?? 0,
    };
  }

  async sumFinishedSecondsBySubject(
    userId: string,
  ): Promise<SubjectTimeSummary[]> {
    const grouped = await prisma.studySession.groupBy({
      by: ["subjectId"],
      _sum: { accumulatedSeconds: true },
      where: { userId, status: "FINISHED" },
    });

    if (grouped.length === 0) {
      return [];
    }

    const subjects = await prisma.subject.findMany({
      where: { id: { in: grouped.map((group) => group.subjectId) } },
      select: { id: true, name: true, color: true },
    });
    const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));

    return grouped
      .map((group) => ({
        subjectId: group.subjectId,
        name: subjectById.get(group.subjectId)?.name ?? "Matéria removida",
        color: subjectById.get(group.subjectId)?.color ?? "#94a3b8",
        seconds: group._sum.accumulatedSeconds ?? 0,
      }))
      .sort((a, b) => b.seconds - a.seconds);
  }

  findLastFinished(userId: string): Promise<SessionWithSubject | null> {
    return prisma.studySession.findFirst({
      where: { userId, status: "FINISHED" },
      include: SUBJECT_SELECT,
      orderBy: { endedAt: "desc" },
    });
  }

  async findFinishedDayKeys(userId: string): Promise<string[]> {
    const rows = await prisma.$queryRaw<{ day: string }[]>`
      SELECT DISTINCT to_char(
        ("endedAt" AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD'
      ) AS day
      FROM study_sessions
      WHERE "userId" = ${userId} AND status = 'FINISHED' AND "endedAt" IS NOT NULL
      ORDER BY day DESC
    `;
    return rows.map((row) => row.day);
  }

  async sumStudiedSecondsForCycleRound(
    cycleId: string,
  ): Promise<CycleSubjectSeconds[]> {
    return prisma.$queryRaw<CycleSubjectSeconds[]>`
      SELECT s."subjectId" AS "subjectId",
             COALESCE(SUM(s."accumulatedSeconds"), 0)::int AS seconds
      FROM study_sessions s
      JOIN cycle_items ci
        ON ci."cycleId" = s."cycleId" AND ci."subjectId" = s."subjectId"
      WHERE s."cycleId" = ${cycleId}
        AND s.status = 'FINISHED'
        AND s."endedAt" >= ci."roundStartedAt"
      GROUP BY s."subjectId"
    `;
  }
}
