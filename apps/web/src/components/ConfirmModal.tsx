interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Estilo do botão de confirmação. "danger" para ações destrutivas. */
  tone?: "primary" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Modal genérico de confirmação, substituindo o `confirm()` nativo. */
export function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "primary",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmClasses =
    tone === "danger"
      ? "bg-danger text-white hover:brightness-95"
      : "bg-accent text-accent-ink hover:brightness-95";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-6 text-ink">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-[10px] px-4 py-2 text-sm text-muted transition hover:bg-raised hover:text-ink disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-[10px] px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${confirmClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
