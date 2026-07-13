"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { api } from "@/lib/api";

/**
 * Linha de ações de um card de ciclo (Ativar / Editar / Excluir). Parte
 * interativa do `/cycles`, que é um Server Component. Após mutar, `router.refresh()`
 * revalida o RSC (recarrega a lista pelo servidor, sem refetch client manual).
 */
export function CycleActions({
  id,
  name,
  isActive,
}: {
  id: string;
  name: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function activate() {
    setBusy(true);
    setError(null);
    try {
      await api.patch(`/study-cycles/${id}/activate`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ativar");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await api.del(`/study-cycles/${id}`);
      setPendingDelete(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2.5 text-sm">
        {!isActive && (
          <button
            onClick={activate}
            disabled={busy}
            className="rounded-[10px] bg-raised px-4 py-2 font-bold text-accent-text transition hover:brightness-110 disabled:opacity-50"
          >
            Ativar
          </button>
        )}
        <Link
          href={`/cycles/${id}`}
          className="flex items-center gap-1.5 rounded-[10px] border border-border-strong px-4 py-2 font-medium text-ink-secondary transition hover:bg-raised"
        >
          <Pencil size={13} /> Editar
        </Link>
        <button
          onClick={() => setPendingDelete(true)}
          disabled={busy}
          aria-label="Excluir ciclo"
          className="flex items-center rounded-[10px] border border-border-strong px-3 py-2 text-danger transition hover:bg-danger/10 disabled:opacity-50"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {pendingDelete && (
        <ConfirmModal
          title={`Excluir "${name}"`}
          message="Esta ação não pode ser desfeita. O ciclo e suas matérias serão removidos (o histórico de sessões é preservado)."
          confirmLabel="Excluir"
          tone="danger"
          busy={busy}
          onConfirm={remove}
          onCancel={() => setPendingDelete(false)}
        />
      )}
    </>
  );
}
