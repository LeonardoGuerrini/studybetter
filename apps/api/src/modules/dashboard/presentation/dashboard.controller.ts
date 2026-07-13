import type { Request, Response } from "express";
import { toSessionResponse } from "../../study-sessions/presentation/session-mapper";
import type { GetDashboardSummaryUseCase } from "../application/get-dashboard-summary-use-case";

export class DashboardController {
  constructor(private readonly getSummary: GetDashboardSummaryUseCase) {}

  summary = async (req: Request, res: Response): Promise<void> => {
    const summary = await this.getSummary.execute(req.userId!);
    res.json({
      totals: summary.totals,
      bySubject: summary.bySubject,
      lastSession: summary.lastSession
        ? toSessionResponse(summary.lastSession)
        : null,
      streakDays: summary.streakDays,
      todaySessionsCount: summary.todaySessionsCount,
    });
  };
}
