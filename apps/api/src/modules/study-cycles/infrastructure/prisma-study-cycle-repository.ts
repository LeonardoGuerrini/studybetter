import { prisma } from "../../../infrastructure/database/prisma";
import type {
  CycleSummary,
  ResolvedCycleItem,
  RoundArchiveEntry,
  StudyCycle,
  StudyCycleRepository,
  StudyCycleWithItems,
} from "../domain/study-cycle";

const ITEMS_INCLUDE = {
  items: {
    include: { subject: { select: { id: true, name: true, color: true } } },
    orderBy: { position: "asc" as const },
  },
} as const;

export class PrismaStudyCycleRepository implements StudyCycleRepository {
  async listByUser(userId: string): Promise<CycleSummary[]> {
    const cycles = await prisma.studyCycle.findMany({
      where: { userId },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { items: true } },
        items: {
          where: { isActive: true },
          orderBy: { position: "asc" },
          select: { plannedMinutes: true, subject: { select: { color: true } } },
        },
      },
    });
    return cycles.map((cycle) => ({
      id: cycle.id,
      name: cycle.name,
      isActive: cycle.isActive,
      itemCount: cycle._count.items,
      totalPlannedMinutes: cycle.items.reduce(
        (sum, item) => sum + item.plannedMinutes,
        0,
      ),
      segments: cycle.items.map((item) => ({
        color: item.subject.color,
        plannedMinutes: item.plannedMinutes,
      })),
      createdAt: cycle.createdAt,
    }));
  }

  findActiveByUser(userId: string): Promise<StudyCycleWithItems | null> {
    return prisma.studyCycle.findFirst({
      where: { userId, isActive: true },
      include: ITEMS_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  findByIdWithItems(
    userId: string,
    id: string,
  ): Promise<StudyCycleWithItems | null> {
    return prisma.studyCycle.findFirst({
      where: { id, userId },
      include: ITEMS_INCLUDE,
    });
  }

  countByUser(userId: string): Promise<number> {
    return prisma.studyCycle.count({ where: { userId } });
  }

  async create(
    userId: string,
    name: string,
    active: boolean,
  ): Promise<StudyCycle> {
    if (active) {
      await prisma.studyCycle.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
    }
    return prisma.studyCycle.create({
      data: { userId, name, isActive: active },
    });
  }

  saveWithItems(
    userId: string,
    cycleId: string,
    name: string,
    items: ResolvedCycleItem[],
    currentPosition: number,
  ): Promise<StudyCycleWithItems> {
    return prisma.$transaction(async (tx) => {
      // Preserva o início da rodada das matérias que continuam no ciclo, para
      // que editar o ciclo não zere o progresso da rodada corrente.
      const existing = await tx.cycleItem.findMany({
        where: { cycleId },
        select: { subjectId: true, roundStartedAt: true },
      });
      const roundStartBySubject = new Map(
        existing.map((item) => [item.subjectId, item.roundStartedAt]),
      );

      await tx.cycleItem.deleteMany({ where: { cycleId } });
      await tx.studyCycle.update({
        where: { id: cycleId },
        data: {
          name,
          currentPosition,
          items: {
            create: items.map((item) => {
              const preserved = roundStartBySubject.get(item.subjectId);
              return preserved ? { ...item, roundStartedAt: preserved } : item;
            }),
          },
        },
      });
      return tx.studyCycle.findFirstOrThrow({
        where: { id: cycleId, userId },
        include: ITEMS_INCLUDE,
      });
    });
  }

  async archiveRound(entries: RoundArchiveEntry[]): Promise<void> {
    if (entries.length === 0) return;
    await prisma.cycleRoundArchive.createMany({ data: entries });
  }

  async resetRound(cycleId: string, at: Date): Promise<void> {
    await prisma.cycleItem.updateMany({
      where: { cycleId },
      data: { roundStartedAt: at },
    });
  }

  async resetItemRound(
    cycleId: string,
    subjectId: string,
    at: Date,
  ): Promise<void> {
    await prisma.cycleItem.updateMany({
      where: { cycleId, subjectId },
      data: { roundStartedAt: at },
    });
  }

  async delete(userId: string, id: string): Promise<void> {
    await prisma.studyCycle.deleteMany({ where: { id, userId } });
  }

  async setActive(userId: string, id: string): Promise<void> {
    await prisma.$transaction([
      prisma.studyCycle.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      }),
      prisma.studyCycle.updateMany({
        where: { id, userId },
        data: { isActive: true },
      }),
    ]);
  }

  async updatePosition(cycleId: string, position: number): Promise<void> {
    await prisma.studyCycle.update({
      where: { id: cycleId },
      data: { currentPosition: position },
    });
  }
}
