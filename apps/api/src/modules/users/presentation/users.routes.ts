import { Router } from "express";
import { validateBody } from "../../../shared/middlewares/validate-request";
import { GetProfileUseCase } from "../application/get-profile-use-case";
import { UpdateProfileUseCase } from "../application/update-profile-use-case";
import { PrismaUserRepository } from "../infrastructure/prisma-user-repository";
import { UsersController } from "./users.controller";
import { updateProfileSchema } from "./users.schemas";

export function makeUsersRoutes(): Router {
  const users = new PrismaUserRepository();
  const controller = new UsersController(
    new GetProfileUseCase(users),
    new UpdateProfileUseCase(users),
  );

  const router = Router();
  router.get("/me", controller.me);
  router.patch("/me", validateBody(updateProfileSchema), controller.updateMe);
  return router;
}
