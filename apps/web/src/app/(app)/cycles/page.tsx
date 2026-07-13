import { apiServer } from "@/lib/api-server";
import type { CycleSegment, CycleSummary } from "@/lib/types";
import { CycleActions } from "./CycleActions";
import { NewCycleButton } from "./NewCycleButton";

function roundLabel(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0min";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  return minutes === 0 ? `${hours}h` : `${hours}h${minutes}`;
}

export default async function CyclesPage() {
  const { cycles } = await apiServer<{ cycles: CycleSummary[] }>("/study-cycles");

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[32px] font-medium tracking-[-0.02em]">Ciclos</h1>
          <p className="mt-2 text-sm text-muted">
            Um ciclo ativo por vez alimenta o modo Estudar.
          </p>
        </div>
        <NewCycleButton />
      </header>

      {cycles.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center">
          <p className="text-muted">
            Você ainda não tem ciclos. Crie o primeiro para organizar seus estudos.
          </p>
          <NewCycleButton variant="empty" />
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {cycles.map((cycle) => (
            <li
              key={cycle.id}
              className={`relative rounded-2xl border bg-surface p-8 ${
                cycle.isActive ? "border-accent" : "border-border"
              }`}
            >
              {cycle.isActive && (
                <span className="absolute right-6 top-6 rounded-full bg-accent-soft px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-accent-text">
                  ativo
                </span>
              )}
              <h3 className="text-[21px] font-semibold">{cycle.name}</h3>
              <p className="mt-2 text-sm text-muted">
                {cycle.itemCount} {cycle.itemCount === 1 ? "matéria" : "matérias"} ·{" "}
                {roundLabel(cycle.totalPlannedMinutes)} por rodada
              </p>

              {cycle.segments.length > 0 && (
                <div className="mt-5 flex gap-1">
                  {cycle.segments.map((segment: CycleSegment, index) => (
                    <span
                      key={index}
                      className="h-2 rounded-full"
                      style={{
                        flex: segment.plannedMinutes,
                        backgroundColor: segment.color,
                      }}
                    />
                  ))}
                </div>
              )}

              <CycleActions
                id={cycle.id}
                name={cycle.name}
                isActive={cycle.isActive}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
