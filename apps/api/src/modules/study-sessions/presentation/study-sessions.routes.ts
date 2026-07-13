import { Router } from "express";
import { validateBody } from "../../../shared/middlewares/validate-request";
import { PrismaStudyCycleRepository } from "../../study-cycles/infrastructure/prisma-study-cycle-repository";
import { PrismaSubjectRepository } from "../../subjects/infrastructure/prisma-subject-repository";
import { FinishSessionUseCase } from "../application/finish-session-use-case";
import { GetActiveSessionUseCase } from "../application/get-active-session-use-case";
import { ListSessionsUseCase } from "../application/list-sessions-use-case";
import { PauseSessionUseCase } from "../application/pause-session-use-case";
import { RegisterStudyUseCase } from "../application/register-study-use-case";
import { ResetSessionUseCase } from "../application/reset-session-use-case";
import { ResumeSessionUseCase } from "../application/resume-session-use-case";
import { StartSessionUseCase } from "../application/start-session-use-case";
import { PrismaStudySessionRepository } from "../infrastructure/prisma-study-session-repository";
import { StudySessionsController } from "./study-sessions.controller";
import {
  finishSessionSchema,
  registerStudySchema,
  startSessionSchema,
} from "./study-sessions.schemas";

export function makeStudySessionsRoutes(): Router {
  const sessions = new PrismaStudySessionRepository();
  const subjects = new PrismaSubjectRepository();
  const cycles = new PrismaStudyCycleRepository();
  const controller = new StudySessionsController(
    new StartSessionUseCase(sessions, subjects, cycles),
    new PauseSessionUseCase(sessions),
    new ResumeSessionUseCase(sessions),
    new ResetSessionUseCase(sessions),
    new FinishSessionUseCase(sessions),
    new GetActiveSessionUseCase(sessions),
    new ListSessionsUseCase(sessions),
    new RegisterStudyUseCase(sessions, subjects, cycles),
  );

  const router = Router();
  router.post("/start", validateBody(startSessionSchema), controller.start);
  router.post("/register", validateBody(registerStudySchema), controller.register);
  router.get("/active", controller.active);
  router.get("/", controller.list);
  router.patch("/:id/pause", controller.pause);
  router.patch("/:id/resume", controller.resume);
  router.patch("/:id/reset", controller.reset);
  router.patch("/:id/finish", validateBody(finishSessionSchema), controller.finish);
  return router;
}
