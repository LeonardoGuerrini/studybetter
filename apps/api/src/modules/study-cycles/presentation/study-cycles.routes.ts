import { Router } from "express";
import { validateBody } from "../../../shared/middlewares/validate-request";
import { PrismaStudySessionRepository } from "../../study-sessions/infrastructure/prisma-study-session-repository";
import { PrismaSubjectRepository } from "../../subjects/infrastructure/prisma-subject-repository";
import { AdvanceCycleUseCase } from "../application/advance-cycle-use-case";
import { CreateCycleUseCase } from "../application/create-cycle-use-case";
import { DeleteCycleUseCase } from "../application/delete-cycle-use-case";
import { GetActiveCycleUseCase } from "../application/get-active-cycle-use-case";
import { GetCycleUseCase } from "../application/get-cycle-use-case";
import { ListCyclesUseCase } from "../application/list-cycles-use-case";
import { RestartCycleUseCase } from "../application/restart-cycle-use-case";
import { RestartSubjectUseCase } from "../application/restart-subject-use-case";
import { SaveCycleUseCase } from "../application/save-cycle-use-case";
import { SetActiveCycleUseCase } from "../application/set-active-cycle-use-case";
import { PrismaStudyCycleRepository } from "../infrastructure/prisma-study-cycle-repository";
import { StudyCyclesController } from "./study-cycles.controller";
import {
  createCycleSchema,
  restartSubjectSchema,
  saveCycleSchema,
} from "./study-cycles.schemas";

export function makeStudyCyclesRoutes(): Router {
  const cycles = new PrismaStudyCycleRepository();
  const subjects = new PrismaSubjectRepository();
  const sessions = new PrismaStudySessionRepository();
  const controller = new StudyCyclesController(
    new ListCyclesUseCase(cycles),
    new CreateCycleUseCase(cycles),
    new GetCycleUseCase(cycles),
    new SaveCycleUseCase(cycles, subjects),
    new DeleteCycleUseCase(cycles),
    new SetActiveCycleUseCase(cycles),
    new GetActiveCycleUseCase(cycles, sessions),
    new AdvanceCycleUseCase(cycles),
    new RestartCycleUseCase(cycles, sessions),
    new RestartSubjectUseCase(cycles, sessions),
  );

  const router = Router();
  // Rotas estáticas antes das dinâmicas (/:id) para não capturar "active".
  router.get("/active", controller.active);
  router.patch("/active/advance", controller.advance);
  router.patch("/active/restart", controller.restart);
  router.patch(
    "/active/subjects/:subjectId/restart",
    validateBody(restartSubjectSchema),
    controller.restartItem,
  );
  router.get("/", controller.list);
  router.post("/", validateBody(createCycleSchema), controller.create);
  router.get("/:id", controller.show);
  router.put("/:id", validateBody(saveCycleSchema), controller.save);
  router.delete("/:id", controller.remove);
  router.patch("/:id/activate", controller.activate);
  return router;
}
