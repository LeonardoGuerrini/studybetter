"use client";

import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

/**
 * Botão "Iniciar sessão" do card "Próxima no ciclo" (a única parte interativa do
 * Dashboard, que é um Server Component). Faz o POST e navega para /study.
 */
export function StartNextButton({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startNext() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/study-sessions/start", { subjectId });
      router.push("/study");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={startNext}
        disabled={busy}
        className="mt-5 inline-flex items-center gap-2 rounded-[10px] bg-accent px-5 py-3 text-sm font-bold text-accent-ink transition hover:brightness-95 disabled:opacity-60"
      >
        <Play size={13} fill="currentColor" strokeWidth={0} />
        Iniciar sessão
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </>
  );
}
