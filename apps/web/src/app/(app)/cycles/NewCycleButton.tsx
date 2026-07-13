"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import type { StudyCycle } from "@/lib/types";

/**
 * Gatilho de criação de ciclo (+ o modal). Usado no header ("Novo ciclo") e no
 * estado vazio ("Criar primeiro ciclo"). Ao criar, navega para o editor.
 */
export function NewCycleButton({ variant = "header" }: { variant?: "header" | "empty" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "header" ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-[10px] bg-accent px-5 py-3 text-sm font-bold text-accent-ink transition hover:brightness-95"
        >
          <Plus size={14} strokeWidth={2.5} /> Novo ciclo
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="mt-4 rounded-[10px] bg-accent px-4 py-2 text-sm font-bold text-accent-ink transition hover:brightness-95"
        >
          Criar primeiro ciclo
        </button>
      )}

      {open && (
        <NewCycleModal
          onClose={() => setOpen(false)}
          onCreated={(id) => router.push(`/cycles/${id}`)}
        />
      )}
    </>
  );
}

function NewCycleModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data = await api.post<{ cycle: StudyCycle }>("/study-cycles", { name });
      onCreated(data.cycle.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-6 text-ink"
      >
        <h3 className="text-lg font-semibold">Novo ciclo</h3>
        <div>
          <label
            htmlFor="cycle-name"
            className="block font-mono text-xs font-semibold uppercase tracking-wider text-muted"
          >
            Nome do ciclo
          </label>
          <input
            id="cycle-name"
            type="text"
            required
            minLength={2}
            maxLength={60}
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Ciclo ENEM 2026"
            className="mt-2 w-full rounded-[10px] border border-border-strong bg-bg px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-[3px] focus:ring-accent-soft"
          />
        </div>
        {error && (
          <p className="rounded-[10px] bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] px-4 py-2 text-sm text-muted transition hover:bg-raised hover:text-ink"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-[10px] bg-accent px-4 py-2 text-sm font-bold text-accent-ink transition hover:brightness-95 disabled:opacity-60"
          >
            {saving ? "Criando..." : "Criar e editar"}
          </button>
        </div>
      </form>
    </div>
  );
}
