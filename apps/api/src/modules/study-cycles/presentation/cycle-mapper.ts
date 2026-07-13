import type { ActiveCycleView } from "../application/get-active-cycle-use-case";
import { firstActivePosition } from "../domain/next-active-position";
import { isConcluded } from "../domain/round-progress";
import type { StudyCycleWithItems } from "../domain/study-cycle";

/** DTO de resposta: expõe os itens e o item ativo atual do ciclo. */
export function toCycleResponse(cycle: StudyCycleWithItems) {
  const activePosition = firstActivePosition(cycle.items, cycle.currentPosition);
  const currentItem =
    cycle.items.length > 0 && cycle.items[activePosition]?.isActive
      ? cycle.items[activePosition]
      : null;

  return {
    id: cycle.id,
    name: cycle.name,
    currentPosition: cycle.currentPosition,
    isActive: cycle.isActive,
    createdAt: cycle.createdAt,
    items: cycle.items,
    currentItem,
  };
}

/** DTO da tela de estudar: itens com tempo estudado na rodada + totais. */
export function toActiveCycleResponse({ cycle, studiedBySubject }: ActiveCycleView) {
  const activePosition = firstActivePosition(cycle.items, cycle.currentPosition);
  const currentItem =
    cycle.items.length > 0 && cycle.items[activePosition]?.isActive
      ? cycle.items[activePosition]
      : null;

  const items = cycle.items.map((item) => {
    const studiedSeconds = studiedBySubject.get(item.subjectId) ?? 0;
    return {
      id: item.id,
      subjectId: item.subjectId,
      position: item.position,
      plannedMinutes: item.plannedMinutes,
      weight: item.weight,
      knowledgeLevel: item.knowledgeLevel,
      priorityScore: item.priorityScore,
      isActive: item.isActive,
      subject: item.subject,
      studiedSeconds,
      concluded: isConcluded(studiedSeconds, item.plannedMinutes),
    };
  });

  const totalStudiedSeconds = items.reduce(
    (sum, item) => sum + item.studiedSeconds,
    0,
  );
  const totalPlannedSeconds = items
    .filter((item) => item.isActive)
    .reduce((sum, item) => sum + item.plannedMinutes * 60, 0);

  return {
    id: cycle.id,
    name: cycle.name,
    currentPosition: cycle.currentPosition,
    isActive: cycle.isActive,
    createdAt: cycle.createdAt,
    items,
    currentItem: currentItem && {
      id: currentItem.id,
      subjectId: currentItem.subjectId,
      position: currentItem.position,
      plannedMinutes: currentItem.plannedMinutes,
      subject: currentItem.subject,
    },
    totalStudiedSeconds,
    totalPlannedSeconds,
  };
}
