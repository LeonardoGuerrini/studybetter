"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDownUp, ChevronLeft, GripVertical, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import type { StudyCycle } from "@/lib/types";

interface EditItem {
  key: string;
  subjectName: string;
  color: string;
  weight: number;
  knowledgeLevel: number;
  plannedMinutes: number;
  isActive: boolean;
  existing: boolean;
}

const SCALE = [1, 2, 3, 4, 5];
const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
];

function priorityOf(item: { weight: number; knowledgeLevel: number }): number {
  return item.weight * (6 - item.knowledgeLevel);
}

/** Sugestão de tempo proporcional à prioridade (15..120min, múltiplos de 5). */
function suggestMinutes(priority: number): number {
  return Math.min(120, Math.max(15, priority * 5));
}

export function CycleEditorClient({ cycle }: { cycle: StudyCycle }) {
  const router = useRouter();
  const cycleId = cycle.id;

  const keyCounter = useRef(0);
  const nextKey = () => `k${(keyCounter.current += 1)}`;

  // Estado seedado pelos dados vindos do servidor (SSR); edições ficam locais
  // até Salvar (padrão staged).
  const [name, setName] = useState(cycle.name);
  const [items, setItems] = useState<EditItem[]>(() =>
    cycle.items.map((item) => ({
      key: nextKey(),
      subjectName: item.subject.name,
      color: item.subject.color,
      weight: item.weight,
      knowledgeLevel: item.knowledgeLevel,
      plannedMinutes: item.plannedMinutes,
      isActive: item.isActive,
      existing: true,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((current) => {
      const from = current.findIndex((item) => item.key === active.id);
      const to = current.findIndex((item) => item.key === over.id);
      return arrayMove(current, from, to);
    });
  }

  function updateItem(key: string, patch: Partial<EditItem>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  function addItem(item: Omit<EditItem, "key" | "existing">) {
    setItems((current) => [...current, { ...item, key: nextKey(), existing: false }]);
  }

  function autoArrange() {
    setItems((current) =>
      [...current]
        .sort((a, b) => priorityOf(b) - priorityOf(a))
        .map((item) => ({
          ...item,
          plannedMinutes: suggestMinutes(priorityOf(item)),
        })),
    );
  }

  function validate(): string | null {
    if (name.trim().length < 2) {
      return "Dê um nome ao ciclo (mínimo de 2 caracteres).";
    }
    if (items.length === 0) {
      return "Adicione ao menos uma matéria ao ciclo.";
    }
    const seen = new Set<string>();
    for (const item of items) {
      const key = item.subjectName.trim().toLowerCase();
      if (!key) return "Há uma matéria sem nome.";
      if (seen.has(key)) {
        return `Matéria duplicada: "${item.subjectName.trim()}". Use nomes distintos.`;
      }
      seen.add(key);
    }
    return null;
  }

  async function save() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.put(`/study-cycles/${cycleId}`, {
        name,
        items: items.map((item) => ({
          subjectName: item.subjectName,
          color: item.color,
          weight: item.weight,
          knowledgeLevel: item.knowledgeLevel,
          plannedMinutes: item.plannedMinutes,
          isActive: item.isActive,
        })),
      });
      router.push("/cycles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/cycles"
            className="flex items-center gap-1.5 text-[13px] text-muted transition hover:text-ink"
          >
            <ChevronLeft size={13} /> Ciclos
          </Link>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label="Nome do ciclo"
            maxLength={60}
            className="mt-2 w-full max-w-md rounded-md bg-transparent font-serif text-[30px] font-medium tracking-[-0.02em] text-ink outline-none transition focus:bg-surface focus:px-2"
          />
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={autoArrange}
            disabled={items.length === 0}
            className="flex items-center gap-2 rounded-[10px] border border-border-strong bg-surface px-5 py-2.5 text-sm font-semibold text-ink-secondary transition hover:bg-raised disabled:opacity-50"
          >
            <ArrowDownUp size={14} /> Auto-organizar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-[10px] bg-accent px-6 py-2.5 text-sm font-bold text-accent-ink transition hover:brightness-95 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      <p className="font-mono text-xs text-faint">
        arraste para reordenar · edite peso e nível a qualquer momento · prioridade
        = peso × (6 − nível)
      </p>

      {error && (
        <p className="rounded-[10px] bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
          Nenhuma matéria ainda. Adicione a primeira abaixo.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((item) => item.key)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2.5">
              {items.map((item) => (
                <SortableItemRow
                  key={item.key}
                  item={item}
                  onChange={(patch) => updateItem(item.key, patch)}
                  onRemove={() => removeItem(item.key)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <AddItemForm onAdd={addItem} />
    </div>
  );
}

function Toggle({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      aria-label={on ? "Desativar matéria" : "Ativar matéria"}
      className={`relative h-5 w-9 shrink-0 rounded-full transition ${
        on ? "bg-accent" : "bg-border-strong"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
          on ? "right-0.5 bg-accent-ink" : "left-0.5 bg-faint"
        }`}
      />
    </button>
  );
}

function SortableItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: EditItem;
  onChange: (patch: Partial<EditItem>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : item.isActive ? 1 : 0.5,
  };

  const priority = priorityOf(item);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-3 rounded-[14px] border border-border bg-surface px-5 py-4 md:flex-nowrap md:gap-4"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-faint active:cursor-grabbing"
        aria-label="Arrastar"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>

      <ColorPicker color={item.color} onChange={(color) => onChange({ color })} />

      <span className="min-w-[7rem] flex-1 truncate text-[15px] font-semibold">
        {item.subjectName}
      </span>

      <span className="flex items-center gap-2 font-mono text-[13px] text-muted">
        peso
        <select
          value={item.weight}
          onChange={(e) => onChange({ weight: Number(e.target.value) })}
          className="rounded border border-border-strong bg-bg px-1 py-0.5 text-ink"
        >
          {SCALE.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        nível
        <select
          value={item.knowledgeLevel}
          onChange={(e) => onChange({ knowledgeLevel: Number(e.target.value) })}
          className="rounded border border-border-strong bg-bg px-1 py-0.5 text-ink"
        >
          {SCALE.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </span>

      <span className="flex items-center gap-1.5">
        <input
          type="number"
          min={5}
          max={600}
          step={5}
          value={item.plannedMinutes}
          onChange={(e) => onChange({ plannedMinutes: Number(e.target.value) })}
          className="w-16 rounded-lg border border-border-strong bg-bg px-2.5 py-1.5 text-center font-mono text-[13px] text-ink outline-none focus:border-accent"
        />
        <span className="text-xs text-muted">min</span>
      </span>

      <span className="w-14 text-right font-mono text-[13px] font-semibold text-accent-text">
        P·{priority}
      </span>

      <Toggle
        on={item.isActive}
        onToggle={() => onChange({ isActive: !item.isActive })}
      />

      <button
        type="button"
        onClick={onRemove}
        aria-label="Remover"
        className="text-faint transition hover:text-danger"
      >
        <X size={14} />
      </button>
    </li>
  );
}

function ColorPicker({
  color,
  onChange,
}: {
  color: string;
  onChange: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Cor da matéria"
        className="h-3.5 w-3.5 rounded-[3px]"
        style={{ backgroundColor: color }}
      />
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-6 z-20 flex gap-1 rounded-[10px] border border-border bg-surface p-2">
            {COLORS.map((option) => (
              <button
                key={option}
                type="button"
                aria-label={`Cor ${option}`}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`h-5 w-5 rounded-[4px] transition ${
                  color === option ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""
                }`}
                style={{ backgroundColor: option }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AddItemForm({
  onAdd,
}: {
  onAdd: (item: Omit<EditItem, "key" | "existing">) => void;
}) {
  const [subjectName, setSubjectName] = useState("");
  const [color, setColor] = useState(COLORS[6]);
  const [weight, setWeight] = useState(3);
  const [knowledgeLevel, setKnowledgeLevel] = useState(3);
  const [plannedMinutes, setPlannedMinutes] = useState(30);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onAdd({
      subjectName: subjectName.trim(),
      color,
      weight,
      knowledgeLevel,
      plannedMinutes,
      isActive: true,
    });
    setSubjectName("");
    setColor(COLORS[6]);
    setWeight(3);
    setKnowledgeLevel(3);
    setPlannedMinutes(30);
  }

  const labelClass =
    "block font-mono text-[11px] font-semibold uppercase tracking-wider text-muted";
  const fieldClass =
    "mt-2 rounded-[10px] border border-border-strong bg-bg px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 rounded-[14px] border border-dashed border-border-strong bg-surface p-6"
    >
      <div className="min-w-[10rem] flex-1">
        <label htmlFor="add-name" className={labelClass}>
          Nova matéria
        </label>
        <input
          id="add-name"
          type="text"
          required
          minLength={2}
          maxLength={50}
          value={subjectName}
          onChange={(event) => setSubjectName(event.target.value)}
          placeholder="Ex.: Informática"
          className={`w-full ${fieldClass}`}
        />
      </div>

      <div>
        <label htmlFor="add-weight" className={labelClass}>
          Peso
        </label>
        <select
          id="add-weight"
          value={weight}
          onChange={(event) => setWeight(Number(event.target.value))}
          className={fieldClass}
        >
          {SCALE.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="add-level" className={labelClass}>
          Nível
        </label>
        <select
          id="add-level"
          value={knowledgeLevel}
          onChange={(event) => setKnowledgeLevel(Number(event.target.value))}
          className={fieldClass}
        >
          {SCALE.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="add-time" className={labelClass}>
          Min
        </label>
        <input
          id="add-time"
          type="number"
          min={5}
          max={600}
          step={5}
          value={plannedMinutes}
          onChange={(event) => setPlannedMinutes(Number(event.target.value))}
          className={`w-20 ${fieldClass}`}
        />
      </div>

      <div className="flex items-center gap-1.5 pb-2.5">
        {COLORS.map((option) => (
          <button
            key={option}
            type="button"
            aria-label={`Cor ${option}`}
            onClick={() => setColor(option)}
            className={`h-5 w-5 rounded-[6px] transition ${
              color === option
                ? "ring-2 ring-accent ring-offset-2 ring-offset-surface"
                : "hover:scale-110"
            }`}
            style={{ backgroundColor: option }}
          />
        ))}
      </div>

      <button
        type="submit"
        className="flex items-center gap-2 rounded-[10px] bg-ink px-5 py-2.5 text-sm font-bold text-bg transition hover:opacity-90"
      >
        <Plus size={13} strokeWidth={2.5} /> Adicionar
      </button>
    </form>
  );
}
