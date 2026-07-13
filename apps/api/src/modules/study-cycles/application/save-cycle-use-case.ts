import { NotFoundError } from "../../../shared/errors/AppError";
import type { SubjectRepository } from "../../subjects/domain/subject";
import { calculateItemPriority } from "../domain/calculate-item-priority";
import { firstActivePosition } from "../domain/next-active-position";
import type {
  ResolvedCycleItem,
  StudyCycleRepository,
  StudyCycleWithItems,
} from "../domain/study-cycle";

export interface SaveCycleItemInput {
  subjectName: string;
  color: string;
  weight: number;
  knowledgeLevel: number;
  plannedMinutes: number;
  isActive: boolean;
}

interface SaveCycleInput {
  userId: string;
  cycleId: string;
  name: string;
  items: SaveCycleItemInput[];
}

export class SaveCycleUseCase {
  constructor(
    private readonly cycles: StudyCycleRepository,
    private readonly subjects: SubjectRepository,
  ) {}

  async execute({
    userId,
    cycleId,
    name,
    items,
  }: SaveCycleInput): Promise<StudyCycleWithItems> {
    const cycle = await this.cycles.findByIdWithItems(userId, cycleId);
    if (!cycle) {
      throw new NotFoundError("Ciclo de estudos");
    }

    // Resolve todas as matérias numa tacada (sem N+1): reaproveita/cria e aplica cor.
    const subjects = await this.subjects.resolveManyByName(
      userId,
      items.map((item) => ({ name: item.subjectName, color: item.color })),
    );
    const subjectIdByName = new Map(
      subjects.map((subject) => [subject.name, subject.id]),
    );

    const resolved: ResolvedCycleItem[] = items.map((item, index) => {
      const subjectId = subjectIdByName.get(item.subjectName);
      if (!subjectId) {
        // Não deve ocorrer (resolveManyByName cria/retorna todas), mas falha
        // explícita evita gravar um item com subjectId inválido silenciosamente.
        throw new Error(
          `Falha ao resolver a matéria "${item.subjectName}" ao salvar o ciclo.`,
        );
      }
      return {
        subjectId,
        position: index,
        plannedMinutes: item.plannedMinutes,
        weight: item.weight,
        knowledgeLevel: item.knowledgeLevel,
        priorityScore: calculateItemPriority(item.weight, item.knowledgeLevel),
        isActive: item.isActive,
      };
    });

    const currentPosition = firstActivePosition(
      resolved,
      Math.min(cycle.currentPosition, Math.max(0, resolved.length - 1)),
    );

    return this.cycles.saveWithItems(
      userId,
      cycleId,
      name,
      resolved,
      currentPosition,
    );
  }
}
