"use client";

import {
  Check,
  Eye,
  EyeOff,
  MoreVertical,
  NotebookPen,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ProgressRing } from "@/components/ProgressRing";
import {
  RegisterStudyModal,
  type RegisterStudyPayload,
} from "@/components/RegisterStudyModal";
import { RestartSubjectModal } from "@/components/RestartSubjectModal";
import { api } from "@/lib/api";
import { useFocusMode } from "@/lib/focus-mode";
import { formatClock, formatDuration } from "@/lib/format";
import type { ActiveCycle, ActiveCycleItem, StudySession } from "@/lib/types";
import { useSessionTimer } from "@/lib/use-session-timer";

/** Duração compacta "H:MM" (para as metas da fila). */
function compact(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

const RECENT_QUERY = "/study-sessions?page=1&pageSize=6&status=FINISHED";

export function StudyClient({
  initialCycle,
  initialSession,
  initialRecent,
}: {
  initialCycle: ActiveCycle | null;
  initialSession: StudySession | null;
  initialRecent: StudySession[];
}) {
  // Estado seedado pelos dados do servidor (SSR): sem fetch-após-montar, sem spinner.
  const [cycle, setCycle] = useState<ActiveCycle | null>(initialCycle);
  const [session, setSession] = useState<StudySession | null>(initialSession);
  const [recent, setRecent] = useState<StudySession[]>(initialRecent);
  const [busy, setBusy] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [manualTarget, setManualTarget] = useState<ActiveCycleItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRestartCycle, setConfirmRestartCycle] = useState(false);
  const [restartTarget, setRestartTarget] = useState<ActiveCycleItem | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const { focus, setFocus, revealed, setRevealed } = useFocusMode();

  // O valor vivo do cronômetro é mantido pelo FocusPanel (tick escopado) e
  // espelhado neste ref, para as ações otimistas congelarem no valor exibido
  // sem re-renderizar a página inteira a cada segundo.
  const elapsedRef = useRef(0);

  // Liga o modo foco se já há sessão aberta (equivale ao antigo load());
  // desliga ao sair da tela para não vazar para outras rotas.
  useEffect(() => {
    setFocus(Boolean(initialSession));
    return () => setFocus(false);
  }, [initialSession, setFocus]);

  // Recargas direcionadas após mutações (evitam refazer os 3 fetches iniciais).
  const reloadCycle = useCallback(async () => {
    const { cycle } = await api.get<{ cycle: ActiveCycle | null }>(
      "/study-cycles/active",
    );
    setCycle(cycle);
  }, []);

  const reloadRecent = useCallback(async () => {
    const { sessions } = await api.get<{ sessions: StudySession[] }>(RECENT_QUERY);
    setRecent(sessions);
  }, []);

  // Fonte da verdade do servidor — usada para desfazer um update otimista que falhou.
  const reloadActive = useCallback(async () => {
    const { session } = await api.get<{ session: StudySession | null }>(
      "/study-sessions/active",
    );
    setSession(session);
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setBusy(false);
    }
  }

  const startSession = (subjectId: string) =>
    run(async () => {
      const data = await api.post<{ session: StudySession }>(
        "/study-sessions/start",
        { subjectId },
      );
      setSession(data.session);
      setSelectedSubjectId(null);
      setFocus(true);
      setRevealed(false);
      // Iniciar move o ponteiro do ciclo no backend; recarrega só o ciclo (1 GET,
      // no lugar dos 3 fetches do load()). A sessão já veio no POST.
      await reloadCycle();
    });

  // Pausar/Retomar/Reiniciar aplicam o novo estado na hora (a UI não espera o
  // round-trip) e reconciliam com a resposta do servidor; em erro, recarregam
  // o estado real.
  const pauseSession = () =>
    run(async () => {
      if (!session) return;
      const frozen = elapsedRef.current;
      setSession({
        ...session,
        status: "PAUSED",
        elapsedSeconds: frozen,
        accumulatedSeconds: frozen,
        lastResumedAt: null,
      });
      try {
        const data = await api.patch<{ session: StudySession }>(
          `/study-sessions/${session.id}/pause`,
        );
        setSession(data.session);
      } catch (err) {
        await reloadActive();
        throw err;
      }
    });

  const resumeSession = () =>
    run(async () => {
      if (!session) return;
      setSession({
        ...session,
        status: "RUNNING",
        lastResumedAt: new Date().toISOString(),
      });
      try {
        const data = await api.patch<{ session: StudySession }>(
          `/study-sessions/${session.id}/resume`,
        );
        setSession(data.session);
      } catch (err) {
        await reloadActive();
        throw err;
      }
    });

  const resetSession = () =>
    run(async () => {
      if (!session) return;
      setSession({
        ...session,
        status: "PAUSED",
        elapsedSeconds: 0,
        accumulatedSeconds: 0,
        lastResumedAt: null,
      });
      try {
        const data = await api.patch<{ session: StudySession }>(
          `/study-sessions/${session.id}/reset`,
        );
        setSession(data.session);
      } catch (err) {
        await reloadActive();
        throw err;
      }
    });

  const openRegister = () =>
    run(async () => {
      if (!session) return;
      if (session.status === "RUNNING") {
        // Congela o cronômetro na hora e já abre o modal; reconcilia em seguida.
        const frozen = elapsedRef.current;
        setSession({
          ...session,
          status: "PAUSED",
          elapsedSeconds: frozen,
          accumulatedSeconds: frozen,
          lastResumedAt: null,
        });
        setRegisterOpen(true);
        try {
          const data = await api.patch<{ session: StudySession }>(
            `/study-sessions/${session.id}/pause`,
          );
          setSession(data.session);
        } catch (err) {
          setRegisterOpen(false);
          await reloadActive();
          throw err;
        }
      } else {
        setRegisterOpen(true);
      }
    });

  const finishSession = (payload: RegisterStudyPayload) =>
    run(async () => {
      if (!session) return;
      await api.patch(`/study-sessions/${session.id}/finish`, payload);
      setSession(null);
      setRegisterOpen(false);
      // Só o ciclo e os últimos estudos mudam; a sessão já foi limpa localmente.
      await Promise.all([reloadCycle(), reloadRecent()]);
    });

  const registerStudy = (payload: RegisterStudyPayload) =>
    run(async () => {
      if (!manualTarget) return;
      await api.post("/study-sessions/register", {
        subjectId: manualTarget.subjectId,
        ...payload,
      });
      setManualTarget(null);
      await Promise.all([reloadCycle(), reloadRecent()]);
    });

  const restartCycle = () =>
    run(async () => {
      await api.patch("/study-cycles/active/restart");
      setConfirmRestartCycle(false);
      // Reinício mexe só no progresso do ciclo (sessão/últimos estudos intactos).
      await reloadCycle();
    });

  const restartSubject = (subjectId: string, mode: "save" | "discard") =>
    run(async () => {
      await api.patch(`/study-cycles/active/subjects/${subjectId}/restart`, {
        mode,
      });
      setRestartTarget(null);
      await reloadCycle();
    });

  if (!cycle) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-10 text-center">
        <p className="text-muted">
          Nenhum ciclo ativo. Crie ou ative um ciclo para começar a estudar.
        </p>
        <Link
          href="/cycles"
          className="mt-4 inline-block rounded-[10px] bg-accent px-4 py-2 text-sm font-bold text-accent-ink transition hover:brightness-95"
        >
          Ir para Ciclos
        </Link>
      </div>
    );
  }

  const sessionItem = session
    ? cycle.items.find((item) => item.subjectId === session.subjectId) ?? null
    : null;
  const selectedItem = selectedSubjectId
    ? cycle.items.find((item) => item.subjectId === selectedSubjectId) ?? null
    : null;
  // Sem sessão e sem seleção manual: o painel mostra o total do ciclo (não
  // pré-seleciona nenhuma matéria).
  const focusItem = sessionItem ?? selectedItem;

  const listHidden = focus && !revealed;

  return (
    <div className="mx-auto max-w-6xl">
      {error && (
        <p className="mb-6 rounded-[10px] bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {focus && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setRevealed(!revealed)}
            className="flex items-center gap-2 rounded-[10px] border border-border-strong bg-surface px-3.5 py-2 text-xs font-semibold text-ink-secondary transition hover:bg-raised"
          >
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
            {revealed ? "Ocultar menu" : "Mostrar menu"}
          </button>
        </div>
      )}

      <div
        className={
          listHidden
            ? "grid"
            : "grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-0"
        }
      >
        <FocusPanel
          session={session}
          focus={focusItem}
          elapsedRef={elapsedRef}
          totalStudiedSeconds={cycle.totalStudiedSeconds}
          totalPlannedSeconds={cycle.totalPlannedSeconds}
          busy={busy}
          onStart={() => focusItem && startSession(focusItem.subjectId)}
          onPause={pauseSession}
          onResume={resumeSession}
          onReset={resetSession}
          onFinish={openRegister}
        />

        {!listHidden && (
        <section className="flex flex-col gap-7 lg:border-l lg:border-raised lg:pl-9">
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
                {cycle.name}
              </p>
              <button
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Opções do ciclo"
                className="text-faint transition hover:text-ink"
              >
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-7 z-10 w-44 rounded-[10px] border border-border bg-surface py-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmRestartCycle(true);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-ink-secondary transition hover:bg-raised"
                  >
                    <RefreshCw size={14} /> Reiniciar ciclo
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3.5 flex gap-1">
              {cycle.items
                .filter((item) => item.isActive)
                .map((item) => (
                  <span
                    key={item.id}
                    className="h-1.5 rounded-[3px]"
                    style={{
                      flex: item.plannedMinutes,
                      backgroundColor:
                        item.studiedSeconds > 0
                          ? item.subject.color
                          : "var(--sb-track)",
                    }}
                  />
                ))}
            </div>
            <p className="mt-2.5 font-mono text-xs text-muted">
              {formatClock(cycle.totalStudiedSeconds)} /{" "}
              {formatClock(cycle.totalPlannedSeconds)} nesta rodada
            </p>
          </div>

          {cycle.items.length === 0 ? (
            <p className="text-sm text-muted">
              Este ciclo não tem matérias.{" "}
              <Link href={`/cycles/${cycle.id}`} className="text-accent-text hover:underline">
                Edite o ciclo
              </Link>{" "}
              para adicionar.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {cycle.items.map((item) => (
                <QueueRow
                  key={item.id}
                  item={item}
                  isCurrent={item.position === cycle.currentPosition}
                  isSelected={item.subjectId === selectedSubjectId}
                  canSelect={!session && item.isActive}
                  busy={busy}
                  onSelect={() => setSelectedSubjectId(item.subjectId)}
                  onRestart={() => setRestartTarget(item)}
                  onRegister={() => setManualTarget(item)}
                />
              ))}
            </div>
          )}

          <RecentStudies sessions={recent} />
        </section>
        )}
      </div>

      {registerOpen && session && (
        <RegisterStudyModal
          subject={session.subject}
          defaultNetSeconds={session.elapsedSeconds}
          onSubmit={finishSession}
          onCancel={() => setRegisterOpen(false)}
        />
      )}

      {manualTarget && (
        <RegisterStudyModal
          subject={manualTarget.subject}
          defaultNetSeconds={0}
          onSubmit={registerStudy}
          onCancel={() => setManualTarget(null)}
        />
      )}

      {restartTarget && (
        <RestartSubjectModal
          subjectName={restartTarget.subject.name}
          busy={busy}
          onChoose={(mode) => restartSubject(restartTarget.subjectId, mode)}
          onCancel={() => setRestartTarget(null)}
        />
      )}

      {confirmRestartCycle && (
        <ConfirmModal
          title="Reiniciar ciclo"
          message="O tempo estudado da rodada será zerado e o ciclo voltará ao início. O histórico de sessões e as anotações são sempre preservados."
          confirmLabel="Reiniciar ciclo"
          busy={busy}
          onConfirm={restartCycle}
          onCancel={() => setConfirmRestartCycle(false)}
        />
      )}
    </div>
  );
}

function FocusPanel({
  session,
  focus,
  elapsedRef,
  totalStudiedSeconds,
  totalPlannedSeconds,
  busy,
  onStart,
  onPause,
  onResume,
  onReset,
  onFinish,
}: {
  session: StudySession | null;
  focus: ActiveCycleItem | null;
  elapsedRef: MutableRefObject<number>;
  totalStudiedSeconds: number;
  totalPlannedSeconds: number;
  busy: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onFinish: () => void;
}) {
  const elapsed = useSessionTimer(session);
  const isRunning = session?.status === "RUNNING";

  // Espelha o valor vivo do cronômetro para o ref da página (usado nas ações
  // otimistas). Fica aqui para o tick de 1s re-renderizar só o FocusPanel.
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed, elapsedRef]);

  // Estado inicial (sem sessão e sem matéria selecionada): visão geral do ciclo.
  const cycleOverview = !session && !focus;

  const plannedSeconds = focus ? focus.plannedMinutes * 60 : 0;
  const ringSeconds = (focus?.studiedSeconds ?? 0) + elapsed;
  const progress = cycleOverview
    ? totalPlannedSeconds > 0
      ? totalStudiedSeconds / totalPlannedSeconds
      : 0
    : plannedSeconds > 0
      ? ringSeconds / plannedSeconds
      : 0;
  const pct = Math.min(100, Math.round(progress * 100));
  const focusColor = session?.subject.color ?? focus?.subject.color ?? "#8a8a94";
  const focusName = session?.subject.name ?? focus?.subject.name ?? "—";

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-6 lg:pr-10">
      <span className="flex items-center gap-2.5 text-sm text-ink-secondary">
        {cycleOverview ? (
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
            Progresso do ciclo
          </span>
        ) : (
          <>
            <span
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ backgroundColor: focusColor }}
            />
            {focusName}
            {session && (
              <span
                className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider ${
                  isRunning
                    ? "bg-accent text-accent-ink"
                    : "bg-raised text-muted"
                }`}
              >
                {isRunning ? "rodando" : "pausado"}
              </span>
            )}
          </>
        )}
      </span>

      <ProgressRing progress={progress} size={290}>
        {cycleOverview ? (
          <>
            <span className="font-mono text-[42px] font-bold tabular-nums tracking-tighter">
              {formatClock(totalStudiedSeconds)}
            </span>
            <span className="font-mono text-[13px] text-muted">
              de {formatClock(totalPlannedSeconds)} no ciclo · {pct}%
            </span>
          </>
        ) : (
          <>
            <span className="font-mono text-[52px] font-bold tabular-nums tracking-tighter">
              {formatClock(elapsed)}
            </span>
            <span className="font-mono text-[13px] text-muted">
              meta {formatClock(plannedSeconds)} · {pct}%
            </span>
          </>
        )}
      </ProgressRing>

      <div className="flex items-center gap-3.5">
        {session ? (
          <>
            <button
              onClick={isRunning ? onPause : onResume}
              disabled={busy}
              aria-label={isRunning ? "Pausar" : "Retomar"}
              className="flex h-[54px] w-[54px] items-center justify-center rounded-[15px] border border-border-strong bg-surface text-ink transition hover:bg-raised disabled:opacity-50"
            >
              {isRunning ? (
                <Pause size={18} fill="currentColor" strokeWidth={0} />
              ) : (
                <Play size={18} fill="currentColor" strokeWidth={0} />
              )}
            </button>
            <button
              onClick={onReset}
              disabled={busy}
              aria-label="Reiniciar timer"
              title="Reiniciar timer (zera e pausa)"
              className="flex h-[54px] w-[54px] items-center justify-center rounded-[15px] border border-border-strong bg-surface text-ink transition hover:bg-raised disabled:opacity-50"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={onFinish}
              disabled={busy}
              className="flex h-[54px] items-center gap-2.5 rounded-[15px] bg-accent px-8 text-[15px] font-bold text-accent-ink transition hover:brightness-95 disabled:opacity-50"
            >
              <Check size={17} strokeWidth={2.5} />
              Finalizar sessão
            </button>
          </>
        ) : focus ? (
          <button
            onClick={onStart}
            disabled={busy}
            className="flex h-[54px] items-center gap-2.5 rounded-[15px] bg-accent px-8 text-[15px] font-bold text-accent-ink transition hover:brightness-95 disabled:opacity-50"
          >
            <Play size={16} fill="currentColor" strokeWidth={0} />
            Iniciar Sessão
          </button>
        ) : (
          <p className="font-mono text-xs text-faint">
            selecione uma matéria na lista para começar
          </p>
        )}
      </div>

      <p className="font-mono text-xs text-faint">
        o timer sobrevive a reloads — pode fechar a aba
      </p>
    </div>
  );
}

function QueueRow({
  item,
  isCurrent,
  isSelected,
  canSelect,
  busy,
  onSelect,
  onRestart,
  onRegister,
}: {
  item: ActiveCycleItem;
  isCurrent: boolean;
  isSelected: boolean;
  canSelect: boolean;
  busy: boolean;
  onSelect: () => void;
  onRestart: () => void;
  onRegister: () => void;
}) {
  const plannedSeconds = item.plannedMinutes * 60;

  return (
    <div
      className={`group flex items-center gap-3 rounded-[12px] px-3.5 py-3 transition ${
        isSelected
          ? "border border-accent bg-raised"
          : isCurrent
            ? "border border-border-strong bg-raised"
            : ""
      } ${item.isActive ? "" : "opacity-40"}`}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
        style={{ backgroundColor: item.subject.color }}
      />
      <span
        className={`flex-1 truncate text-sm ${
          isCurrent ? "font-semibold" : ""
        } ${item.concluded ? "text-faint line-through" : ""}`}
      >
        {item.subject.name}
      </span>

      {/* Ações no hover (iniciar qualquer ativa · reiniciar · registrar) */}
      {item.isActive && (
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={onSelect}
            disabled={!canSelect || busy}
            aria-label="Selecionar matéria"
            title="Selecionar matéria"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-faint transition hover:bg-surface hover:text-accent-text disabled:opacity-30"
          >
            <Play size={13} fill="currentColor" strokeWidth={0} />
          </button>
          <button
            onClick={onRegister}
            disabled={busy}
            aria-label="Registrar Estudo"
            title="Registrar Estudo"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-faint transition hover:bg-surface hover:text-ink disabled:opacity-30"
          >
            <NotebookPen size={13} />
          </button>
          <button
            onClick={onRestart}
            disabled={busy}
            aria-label="Reiniciar matéria"
            title="Reiniciar matéria"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-faint transition hover:bg-surface hover:text-ink disabled:opacity-30"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      )}

      {item.concluded ? (
        <Check size={16} className="shrink-0 text-accent-text" strokeWidth={2.5} />
      ) : !item.isActive ? (
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-faint">
          inativa
        </span>
      ) : (
        <span
          className={`shrink-0 font-mono text-xs ${
            isCurrent ? "text-accent-text" : "text-muted"
          }`}
        >
          {compact(item.studiedSeconds)}/{compact(plannedSeconds)}
        </span>
      )}
    </div>
  );
}

function RecentStudies({ sessions }: { sessions: StudySession[] }) {
  const finished = sessions.filter((s) => s.status === "FINISHED").slice(0, 6);
  if (finished.length === 0) return null;

  return (
    <div className="border-t border-raised pt-6">
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
        Últimos estudos
      </p>
      <div className="mt-3.5 flex flex-col gap-3">
        {finished.map((s) => {
          const day = new Date(s.endedAt ?? s.startedAt)
            .toLocaleDateString("pt-BR", { weekday: "short" })
            .replace(".", "");
          return (
            <div key={s.id} className="flex items-center gap-2.5 text-[13px]">
              <span
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: s.subject.color }}
              />
              <span className="flex-1 truncate">{s.subject.name}</span>
              <span className="font-mono text-muted">
                {day} · {formatDuration(s.accumulatedSeconds)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
