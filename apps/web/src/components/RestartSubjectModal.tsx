interface RestartSubjectModalProps {
  subjectName: string;
  busy: boolean;
  onChoose: (mode: "save" | "discard") => void;
  onCancel: () => void;
}

export function RestartSubjectModal({
  subjectName,
  busy,
  onChoose,
  onCancel,
}: RestartSubjectModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-6 text-ink">
        <h3 className="text-lg font-semibold">Reiniciar {subjectName}</h3>
        <p className="text-sm text-muted">
          Deseja reiniciar o tempo desta matéria na rodada? Escolha se quer
          guardar o tempo já estudado ou descartá-lo. Suas anotações e o
          histórico de sessões são sempre preservados.
        </p>
        <div className="space-y-2">
          <button
            onClick={() => onChoose("save")}
            disabled={busy}
            className="w-full rounded-[10px] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition hover:brightness-95 disabled:opacity-60"
          >
            Salvar o tempo estudado e reiniciar
          </button>
          <button
            onClick={() => onChoose("discard")}
            disabled={busy}
            className="w-full rounded-[10px] border border-border-strong px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-60"
          >
            Descartar o tempo estudado
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className="w-full rounded-[10px] px-4 py-2.5 text-sm text-muted transition hover:bg-raised hover:text-ink disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
