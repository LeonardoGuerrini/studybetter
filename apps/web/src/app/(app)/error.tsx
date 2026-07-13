"use client";

import { RotateCcw } from "lucide-react";

/**
 * Error boundary das rotas autenticadas. Cobre falhas do fetch server-side
 * (`lib/api-server.ts`) — ex.: API fora do ar ou timeout no cold start do Render.
 * O redirect de 401 não cai aqui (é tratado como navegação, não erro).
 */
export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-border bg-surface p-10 text-center">
      <h2 className="font-serif text-[22px] font-medium">Algo deu errado</h2>
      <p className="mt-3 text-sm text-muted">
        Não conseguimos carregar seus dados agora. Isso costuma ser temporário —
        tente de novo em alguns instantes.
      </p>
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-accent px-5 py-3 text-sm font-bold text-accent-ink transition hover:brightness-95"
      >
        <RotateCcw size={15} /> Tentar de novo
      </button>
    </div>
  );
}
