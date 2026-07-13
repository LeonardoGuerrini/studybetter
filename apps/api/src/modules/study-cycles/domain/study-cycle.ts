export interface StudyCycle {
  id: string;
  userId: string;
  name: string;
  currentPosition: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CycleItemSubjectInfo {
  id: string;
  name: string;
  color: string;
}

export interface CycleItemWithSubject {
  id: string;
  cycleId: string;
  subjectId: string;
  position: number;
  plannedMinutes: number;
  weight: number;
  knowledgeLevel: number;
  priorityScore: number;
  isActive: boolean;
  roundStartedAt: Date;
  subject: CycleItemSubjectInfo;
}

export interface StudyCycleWithItems extends StudyCycle {
  items: CycleItemWithSubject[];
}

/** Segmento da barra empilhada do card de ciclo (por matéria ativa). */
export interface CycleSegment {
  color: string;
  plannedMinutes: number;
}

export interface CycleSummary {
  id: string;
  name: string;
  isActive: boolean;
  itemCount: number;
  /** Soma de plannedMinutes das matérias ativas (tempo "por rodada"). */
  totalPlannedMinutes: number;
  /** Cores + tempo das matérias ativas, para a barra empilhada do card. */
  segments: CycleSegment[];
  createdAt: Date;
}

/** Item já resolvido (subjectId + priorityScore calculados) pronto p/ persistir. */
export interface ResolvedCycleItem {
  subjectId: string;
  position: number;
  plannedMinutes: number;
  weight: number;
  knowledgeLevel: number;
  priorityScore: number;
  isActive: boolean;
}

export type CycleRoundKind = "CYCLE_RESET" | "SUBJECT_SAVE";

export interface RoundArchiveEntry {
  cycleId: string;
  subjectId: string;
  subjectName: string;
  studiedSeconds: number;
  kind: CycleRoundKind;
}

export interface StudyCycleRepository {
  listByUser(userId: string): Promise<CycleSummary[]>;
  findActiveByUser(userId: string): Promise<StudyCycleWithItems | null>;
  findByIdWithItems(
    userId: string,
    id: string,
  ): Promise<StudyCycleWithItems | null>;
  create(userId: string, name: string, active: boolean): Promise<StudyCycle>;
  countByUser(userId: string): Promise<number>;
  saveWithItems(
    userId: string,
    cycleId: string,
    name: string,
    items: ResolvedCycleItem[],
    currentPosition: number,
  ): Promise<StudyCycleWithItems>;
  delete(userId: string, id: string): Promise<void>;
  setActive(userId: string, id: string): Promise<void>;
  updatePosition(cycleId: string, position: number): Promise<void>;
  archiveRound(entries: RoundArchiveEntry[]): Promise<void>;
  resetRound(cycleId: string, at: Date): Promise<void>;
  resetItemRound(cycleId: string, subjectId: string, at: Date): Promise<void>;
}
