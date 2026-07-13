"use client";

import { useState, type FormEvent } from "react";
import type { StudyMethod, StudyPeriod, SubjectInfo } from "@/lib/types";

export interface RegisterStudyPayload {
  netMinutes: number;
  studyDate: string;
  studyPeriod: StudyPeriod;
  studyMethod: StudyMethod;
  questionsCount?: number;
  correctCount?: number;
  pagesStudied?: number;
  notes?: string;
}

const METHOD_OPTIONS: { value: StudyMethod; label: string }[] = [
  { value: "PDF", label: "PDF" },
  { value: "QUESTIONS", label: "Questões" },
  { value: "VIDEO", label: "Vídeo aula" },
  { value: "PDF_QUESTIONS", label: "PDF + Questões" },
  { value: "REVIEW", label: "Revisão" },
  { value: "MIND_MAP", label: "Mapa Mental" },
  { value: "FLASH_CARDS", label: "Flash Cards" },
];

const PERIOD_OPTIONS: { value: StudyPeriod; label: string }[] = [
  { value: "MORNING", label: "Manhã" },
  { value: "AFTERNOON", label: "Tarde" },
  { value: "EVENING", label: "Noite" },
  { value: "DAWN", label: "Madrugada" },
];

/** Detecta o período pelo horário local do usuário. */
function detectPeriod(): StudyPeriod {
  const hour = new Date().getHours();
  if (hour < 6) return "DAWN";
  if (hour < 12) return "MORNING";
  if (hour < 18) return "AFTERNOON";
  return "EVENING";
}

/** Data de hoje no fuso local, no formato yyyy-mm-dd (para <input type="date">). */
function todayLocalISO(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Converte o "yyyy-mm-dd" escolhido num ISO datetime:
 * - se for **hoje**, usa o instante atual (assim um registro de hoje entra na rodada atual do ciclo);
 * - se for uma data passada, usa o meio-dia local (evita o "pulo de dia" por fuso).
 */
function dateInputToISO(value: string): string {
  if (value === todayLocalISO()) {
    return new Date().toISOString();
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0).toISOString();
}

/** Converte um valor de input numérico opcional em número ou undefined. */
function optionalCount(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  return Number(value);
}

interface RegisterStudyModalProps {
  subject: SubjectInfo;
  defaultNetSeconds: number;
  onSubmit: (payload: RegisterStudyPayload) => Promise<void>;
  onCancel: () => void;
}

export function RegisterStudyModal({
  subject,
  defaultNetSeconds,
  onSubmit,
  onCancel,
}: RegisterStudyModalProps) {
  const defaultMinutes = Math.max(1, Math.round(defaultNetSeconds / 60));
  const [hours, setHours] = useState(Math.floor(defaultMinutes / 60));
  const [minutes, setMinutes] = useState(defaultMinutes % 60);
  const [date, setDate] = useState(todayLocalISO());
  const [period, setPeriod] = useState<StudyPeriod>(detectPeriod());
  const [method, setMethod] = useState<StudyMethod>("PDF");
  const [questionsCount, setQuestionsCount] = useState("");
  const [correctCount, setCorrectCount] = useState("");
  const [pagesStudied, setPagesStudied] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const netMinutes = hours * 60 + minutes;
    if (netMinutes < 1) {
      setError("Informe o tempo líquido de estudo.");
      return;
    }
    const questions = optionalCount(questionsCount);
    const correct = optionalCount(correctCount);
    if (correct !== undefined && questions !== undefined && correct > questions) {
      setError("Os acertos não podem exceder as questões feitas.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        netMinutes,
        studyDate: dateInputToISO(date),
        studyPeriod: period,
        studyMethod: method,
        ...(questions !== undefined && { questionsCount: questions }),
        ...(correct !== undefined && { correctCount: correct }),
        ...(optionalCount(pagesStudied) !== undefined && {
          pagesStudied: optionalCount(pagesStudied),
        }),
        ...(notes.trim() && { notes: notes.trim() }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar estudo");
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-[10px] border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none transition focus:border-accent focus:ring-[3px] focus:ring-accent-soft";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="my-8 w-full max-w-md space-y-4 rounded-2xl border border-border bg-surface p-6 text-ink"
      >
        <div>
          <h3 className="text-lg font-semibold">Registrar estudo</h3>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <span
              className="h-3 w-3 rounded-[3px]"
              style={{ backgroundColor: subject.color }}
            />
            {subject.name}
          </p>
        </div>

        {/* Tempo líquido (obrigatório) */}
        <div>
          <label className="block text-sm font-medium">
            Tempo líquido de estudo <span className="text-danger">*</span>
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={hours}
              onChange={(event) => setHours(Math.max(0, Number(event.target.value)))}
              aria-label="Horas"
              className="w-20 rounded-[10px] border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none transition focus:border-accent focus:ring-[3px] focus:ring-accent-soft"
            />
            <span className="text-sm text-muted">h</span>
            <input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(event) =>
                setMinutes(Math.min(59, Math.max(0, Number(event.target.value))))
              }
              aria-label="Minutos"
              className="w-20 rounded-[10px] border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none transition focus:border-accent focus:ring-[3px] focus:ring-accent-soft"
            />
            <span className="text-sm text-muted">min</span>
          </div>
        </div>

        {/* Data + período (obrigatórios) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="study-date" className="block text-sm font-medium">
              Data <span className="text-danger">*</span>
            </label>
            <input
              id="study-date"
              type="date"
              required
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="study-period" className="block text-sm font-medium">
              Período <span className="text-danger">*</span>
            </label>
            <select
              id="study-period"
              value={period}
              onChange={(event) => setPeriod(event.target.value as StudyPeriod)}
              className={inputClass}
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Método (obrigatório) */}
        <div>
          <label htmlFor="study-method" className="block text-sm font-medium">
            Método de estudo <span className="text-danger">*</span>
          </label>
          <select
            id="study-method"
            value={method}
            onChange={(event) => setMethod(event.target.value as StudyMethod)}
            className={inputClass}
          >
            {METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desempenho (opcional) */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="questions-count" className="block text-sm font-medium">
              Questões
            </label>
            <input
              id="questions-count"
              type="number"
              min={0}
              value={questionsCount}
              onChange={(event) => setQuestionsCount(event.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="correct-count" className="block text-sm font-medium">
              Acertos
            </label>
            <input
              id="correct-count"
              type="number"
              min={0}
              value={correctCount}
              onChange={(event) => setCorrectCount(event.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="pages-studied" className="block text-sm font-medium">
              Páginas Estudadas
            </label>
            <input
              id="pages-studied"
              type="number"
              min={0}
              value={pagesStudied}
              onChange={(event) => setPagesStudied(event.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </div>
        </div>

        {/* Descrição (opcional) */}
        <div>
          <label htmlFor="study-notes" className="block text-sm font-medium">
            Descrição do estudo
          </label>
          <textarea
            id="study-notes"
            rows={3}
            maxLength={500}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Parei na página..."
            className={inputClass}
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
            onClick={onCancel}
            disabled={saving}
            className="rounded-[10px] px-4 py-2 text-sm text-muted transition hover:bg-raised hover:text-ink disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-[10px] bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-95 disabled:opacity-60"
          >
            {saving ? "Registrando..." : "Registrar"}
          </button>
        </div>
      </form>
    </div>
  );
}
