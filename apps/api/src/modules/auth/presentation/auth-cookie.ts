import type { Response } from "express";
import { env } from "../../../infrastructure/config/env";
import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_TTL_DAYS,
} from "../../../shared/constants/auth";

const isProd = env.NODE_ENV === "production";

// Em produção o front e a API costumam ficar em domínios diferentes
// (ex.: web na Vercel, API no Railway/Render). Para o navegador enviar o
// cookie httpOnly em requests cross-site é preciso sameSite:"none" + secure.
// Em dev (mesmo host localhost) mantemos "lax".
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: isProd ? "none" : "lax",
  secure: isProd,
  path: "/",
} as const;

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    maxAge: AUTH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, COOKIE_OPTIONS);
}
