import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { TokenService } from "../../modules/auth/domain/auth-contracts";
import { AUTH_COOKIE_NAME } from "../constants/auth";
import { UnauthorizedError } from "../errors/AppError";

export function makeEnsureAuthenticated(tokens: TokenService): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedError();
    }

    try {
      req.userId = tokens.verify(token).sub;
    } catch {
      throw new UnauthorizedError("Sessão expirada ou inválida");
    }

    next();
  };
}
