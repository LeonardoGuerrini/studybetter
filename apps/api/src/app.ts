import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./infrastructure/config/env";
import { makeApiRouter } from "./infrastructure/http/routes";
import { errorHandler } from "./shared/middlewares/error-handler";

export function makeApp(): express.Express {
  const app = express();

  // Em produção a API roda atrás do proxy do Render: confia em 1 hop para obter
  // o IP real (X-Forwarded-For) no rate limiter e nos logs.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", makeApiRouter());

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: "NOT_FOUND", message: "Rota não encontrada" },
    });
  });

  app.use(errorHandler);

  return app;
}
