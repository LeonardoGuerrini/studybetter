import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Cliente HTTP para **Server Components** (data fetching no servidor, perto da
 * API). Diferente do `lib/api.ts` (client, usa o proxy same-origin `/api` p/ o
 * cookie virar first-party), aqui a chamada é **server→server**: lê o cookie de
 * sessão via `next/headers` e bate direto no `API_ORIGIN` do backend,
 * encaminhando o cookie no header. Não há CORS/third-party cookie entre
 * servidores, então não precisamos do rewrite do `next.config.ts`.
 *
 * - `cache: "no-store"`: dados por-usuário, sempre atuais (torna a rota dinâmica).
 * - `401` → `redirect("/login")` (sessão expirada/inválida). A presença do
 *   cookie já é checada no `middleware.ts`; isto cobre token inválido.
 */
const AUTH_COOKIE = "studybetter_token";

const API_ORIGIN =
  process.env.API_ORIGIN ??
  (process.env.NODE_ENV === "production"
    ? "https://studybetter-th4k.onrender.com"
    : "http://localhost:3001");

export async function apiServer<T>(path: string): Promise<T> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;

  const response = await fetch(`${API_ORIGIN}/api${path}`, {
    headers: token ? { Cookie: `${AUTH_COOKIE}=${token}` } : undefined,
    cache: "no-store",
    // Não pendura o SSR se a API demorar (ex.: cold start do Render); o erro
    // sobe para o error boundary da rota.
    signal: AbortSignal.timeout(10000),
  });

  // redirect() lança internamente (NEXT_REDIRECT); fica fora de try/catch.
  if (response.status === 401) {
    redirect("/login");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Erro inesperado ao carregar.");
  }
  return data as T;
}
