import { Flame } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { apiServer } from "@/lib/api-server";
import { formatDateTime, formatDuration } from "@/lib/format";
import type { ActiveCycle, DashboardSummary } from "@/lib/types";
import { StartNextButton } from "./StartNextButton";

/** Rótulo da data de hoje no fuso do público-alvo (Brasília), estável no SSR. */
function todayLabel(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(now);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value.replace(".", "") ?? "";
  return `${get("weekday")} · ${get("day")} ${get("month")} ${get("year")}`;
}

export default async function DashboardPage() {
  const [summary, cycleData] = await Promise.all([
    apiServer<DashboardSummary>("/dashboard/summary"),
    apiServer<{ cycle: ActiveCycle | null }>("/study-cycles/active"),
  ]);
  const cycle = cycleData.cycle;

  const maxSubjectSeconds = Math.max(
    1,
    ...summary.bySubject.map((entry) => entry.seconds),
  );

  const next = cycle?.currentItem ?? null;
  const nextItem = next
    ? cycle?.items.find((item) => item.subjectId === next.subjectId)
    : null;
  const remainingSeconds = nextItem
    ? Math.max(0, nextItem.plannedMinutes * 60 - nextItem.studiedSeconds)
    : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">
            {todayLabel()}
          </p>
          <h1 className="mt-2.5 font-serif text-[40px] font-medium tracking-[-0.02em]">
            Sua evolução
          </h1>
        </div>
        <div className="flex items-center gap-2.5 rounded-full border border-border bg-surface px-5 py-3">
          <Flame size={18} className="text-accent-text" />
          <span className="text-sm">
            <strong className="text-accent-text">
              {summary.streakDays} {summary.streakDays === 1 ? "dia" : "dias"}
            </strong>{" "}
            <span className="text-muted">de sequência</span>
          </span>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <StatCard
          label="Hoje"
          value={formatDuration(summary.totals.todaySeconds)}
          hint={`${summary.todaySessionsCount} ${
            summary.todaySessionsCount === 1
              ? "sessão finalizada"
              : "sessões finalizadas"
          }`}
          highlight
        />
        <StatCard label="Semana" value={formatDuration(summary.totals.weekSeconds)} />
        <StatCard label="Mês" value={formatDuration(summary.totals.monthSeconds)} />
        <StatCard label="Total" value={formatDuration(summary.totals.totalSeconds)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-border bg-surface p-8">
          <h2 className="font-serif text-[19px] font-medium">Tempo por matéria</h2>
          {summary.bySubject.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Nenhuma sessão finalizada ainda.{" "}
              <Link href="/study" className="text-accent-text hover:underline">
                Comece a estudar pelo seu ciclo
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-6 space-y-5">
              {summary.bySubject.map((entry) => (
                <li key={entry.subjectId}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 rounded-[3px]"
                        style={{ backgroundColor: entry.color }}
                      />
                      {entry.name}
                    </span>
                    <span className="font-mono text-[13px] text-muted">
                      {formatDuration(entry.seconds)}
                    </span>
                  </div>
                  <div className="mt-2 h-[7px] w-full overflow-hidden rounded-full bg-track">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: entry.color,
                        width: `${(entry.seconds / maxSubjectSeconds) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-6">
          {next && nextItem && (
            <div className="rounded-2xl border border-border bg-surface p-7">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
                Próxima no ciclo
              </p>
              <p className="mt-3.5 flex items-center gap-2.5 font-serif text-[20px] font-medium">
                <span
                  className="h-2.5 w-2.5 rounded-[3px]"
                  style={{ backgroundColor: next.subject.color }}
                />
                {next.subject.name}
              </p>
              <p className="mt-2 text-[13px] text-muted">
                {remainingSeconds > 0
                  ? `faltam ${formatDuration(remainingSeconds)} da meta desta rodada`
                  : "meta desta rodada concluída"}
              </p>
              <StartNextButton subjectId={next.subjectId} />
            </div>
          )}

          <div className="rounded-2xl border border-border bg-surface p-7">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
              Última sessão
            </p>
            {summary.lastSession ? (
              <>
                <p className="mt-3.5 flex items-center gap-2.5 text-[15px] font-medium">
                  <span
                    className="h-2.5 w-2.5 rounded-[3px]"
                    style={{ backgroundColor: summary.lastSession.subject.color }}
                  />
                  {summary.lastSession.subject.name}
                </p>
                <p className="mt-2 font-mono text-[13px] text-muted">
                  {formatDuration(summary.lastSession.accumulatedSeconds)}
                  {summary.lastSession.endedAt && (
                    <> · {formatDateTime(summary.lastSession.endedAt)}</>
                  )}
                </p>
                {summary.lastSession.notes && (
                  <p className="mt-2 text-[13px] italic text-faint">
                    “{summary.lastSession.notes}”
                  </p>
                )}
              </>
            ) : (
              <p className="mt-3.5 text-sm text-muted">
                Você ainda não finalizou nenhuma sessão.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
