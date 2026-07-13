import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validateBody } from "../../../shared/middlewares/validate-request";
import { PrismaUserRepository } from "../../users/infrastructure/prisma-user-repository";
import { LoginUseCase } from "../application/login-use-case";
import { RegisterUseCase } from "../application/register-use-case";
import type { TokenService } from "../domain/auth-contracts";
import { BcryptPasswordHasher } from "../infrastructure/bcrypt-password-hasher";
import { AuthController } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.schemas";

export function makeAuthRoutes(tokenService: TokenService): Router {
  const users = new PrismaUserRepository();
  const hasher = new BcryptPasswordHasher();
  const controller = new AuthController(
    new RegisterUseCase(users, hasher, tokenService),
    new LoginUseCase(users, hasher, tokenService),
  );

  // Protege contra brute-force/credential stuffing: 10 tentativas por IP a cada
  // 15 min nas rotas de credencial. Resposta no envelope de erro padrão.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: {
          code: "TOO_MANY_REQUESTS",
          message: "Muitas tentativas. Tente novamente em alguns minutos.",
        },
      });
    },
  });

  const router = Router();
  router.post(
    "/register",
    authLimiter,
    validateBody(registerSchema),
    controller.register,
  );
  router.post("/login", authLimiter, validateBody(loginSchema), controller.login);
  router.post("/logout", controller.logout);
  return router;
}
