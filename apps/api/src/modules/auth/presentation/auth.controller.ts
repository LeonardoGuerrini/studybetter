import type { Request, Response } from "express";
import type { LoginUseCase } from "../application/login-use-case";
import type { RegisterUseCase } from "../application/register-use-case";
import { clearAuthCookie, setAuthCookie } from "./auth-cookie";

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const { user, token } = await this.registerUseCase.execute(req.body);
    setAuthCookie(res, token);
    res.status(201).json({ user });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const { user, token } = await this.loginUseCase.execute(req.body);
    setAuthCookie(res, token);
    res.status(200).json({ user });
  };

  logout = (_req: Request, res: Response): void => {
    clearAuthCookie(res);
    res.status(204).send();
  };
}
