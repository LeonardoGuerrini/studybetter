import type { NextConfig } from "next";

// Em produção o front (Vercel) e a API (Render) ficam em domínios diferentes.
// Isso torna o cookie de sessão httpOnly um cookie "third-party", que o navegador
// bloqueia (especialmente em aba anônima / com o phase-out de third-party cookies).
//
// Solução: o front expõe `/api/*` e faz **proxy (rewrite)** para a API. Assim o
// navegador só conversa com o domínio do próprio front → o cookie vira first-party
// e nada é bloqueado. O client usa `NEXT_PUBLIC_API_URL=/api` (relativo) em produção.
//
// `API_ORIGIN` é o destino do proxy (origem da API, sem o /api). Defina no host do
// front (ex.: Vercel). Fallback aponta para a API atual no Render.
const API_ORIGIN =
  process.env.API_ORIGIN ?? "https://studybetter-th4k.onrender.com";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
