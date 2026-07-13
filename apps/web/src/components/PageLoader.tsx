/** Spinner centralizado para estados de carregamento das páginas. */
export function PageLoader({ label = "Carregando..." }: { label?: string }) {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-muted"
      role="status"
      aria-live="polite"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
      {label}
    </div>
  );
}
