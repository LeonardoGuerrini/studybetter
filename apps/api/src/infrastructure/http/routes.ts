import { Router } from "express";
import { JwtTokenService } from "../../modules/auth/infrastructure/jwt-token-service";
import { makeAuthRoutes } from "../../modules/auth/presentation/auth.routes";
import { makeDashboardRoutes } from "../../modules/dashboard/presentation/dashboard.routes";
import { makeStudyCyclesRoutes } from "../../modules/study-cycles/presentation/study-cycles.routes";
import { makeStudySessionsRoutes } from "../../modules/study-sessions/presentation/study-sessions.routes";
import { makeUsersRoutes } from "../../modules/users/presentation/users.routes";
import { makeEnsureAuthenticated } from "../../shared/middlewares/ensure-authenticated";
import { env } from "../config/env";

export function makeApiRouter(): Router {
  const tokenService = new JwtTokenService(env.JWT_SECRET);
  const ensureAuthenticated = makeEnsureAuthenticated(tokenService);

  const router = Router();
  router.use("/auth", makeAuthRoutes(tokenService));
  router.use("/users", ensureAuthenticated, makeUsersRoutes());
  router.use("/study-sessions", ensureAuthenticated, makeStudySessionsRoutes());
  router.use("/study-cycles", ensureAuthenticated, makeStudyCyclesRoutes());
  router.use("/dashboard", ensureAuthenticated, makeDashboardRoutes());
  return router;
}
