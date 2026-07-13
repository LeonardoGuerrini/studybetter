interface ProgressRingProps {
  /** Fração preenchida (0–1). */
  progress: number;
  /** Conteúdo central (timer + meta). */
  children: React.ReactNode;
  size?: number;
}

const STROKE = 10;

/** Anel de progresso single-arc (tela Estudar). Trilho + arco accent. */
export function ProgressRing({ progress, children, size = 340 }: ProgressRingProps) {
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const dash = clamped * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--sb-border)"
          strokeWidth={STROKE}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--sb-accent)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className="transition-[stroke-dasharray] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        {children}
      </div>
    </div>
  );
}
