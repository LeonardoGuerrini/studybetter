import { Router } from "express";
import { PrismaStudySessionRepository } from "../../study-sessions/infrastructure/prisma-study-session-repository";
import { GetDashboardSummaryUseCase } from "../application/get-dashboard-summary-use-case";
import { DashboardController } from "./dashboard.controller";

export function makeDashboardRoutes(): Router {
  const sessions = new PrismaStudySessionRepository();
  const controller = new DashboardController(
    new GetDashboardSummaryUseCase(sessions),
  );

  const router = Router();
  router.get("/summary", controller.summary);
  return router;
}
