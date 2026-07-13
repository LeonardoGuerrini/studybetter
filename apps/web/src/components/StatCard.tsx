interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  /** Card destacado (invertido em accent) — usado no card "Hoje". */
  highlight?: boolean;
}

export function StatCard({ label, value, hint, highlight }: StatCardProps) {
  return (
    <div
      className={`rounded-2xl p-7 ${
        highlight
          ? "bg-accent text-accent-ink"
          : "border border-border bg-surface text-ink"
      }`}
    >
      <p
        className={`font-mono text-xs font-semibold uppercase tracking-wider ${
          highlight ? "text-accent-ink" : "text-muted"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-3.5 font-serif font-medium leading-none tracking-[-0.01em] ${
          highlight ? "text-[42px]" : "text-[30px]"
        }`}
      >
        {value}
      </p>
      {hint && (
        <p className={`mt-3 text-[13px] ${highlight ? "opacity-70" : "text-muted"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}
