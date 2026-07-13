import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Guarda de autenticação no edge (antes de renderizar). Checa a *presença* do
 * cookie httpOnly de sessão — token inválido/expirado é tratado pelo 401 global
 * em `lib/api.ts`. Fazer o redirect aqui evita o waterfall de gatear o render
 * das páginas na resposta de `/users/me`.
 *
 * IMPORTANTE: só protege rotas privadas (sem cookie → /login). NÃO redireciona
 * quem já tem cookie para fora de /login — fazer isso criava um loop com o
 * redirect de 401 (cookie inválido presente → /dashboard 401 → /login →
 * middleware manda pra /dashboard de novo…).
 */
const AUTH_COOKIE = "studybetter_token";
const PROTECTED = ["/dashboard", "/study", "/cycles"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtected && !req.cookies.has(AUTH_COOKIE)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/study/:path*", "/cycles/:path*"],
};
