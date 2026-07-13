import { prisma } from "../../../infrastructure/database/prisma";
import type {
  Subject,
  SubjectNameColor,
  SubjectRepository,
} from "../domain/subject";

export class PrismaSubjectRepository implements SubjectRepository {
  findById(userId: string, id: string): Promise<Subject | null> {
    return prisma.subject.findFirst({ where: { id, userId } });
  }

  listByUser(userId: string): Promise<Subject[]> {
    return prisma.subject.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
  }

  async resolveManyByName(
    userId: string,
    entries: SubjectNameColor[],
  ): Promise<Subject[]> {
    if (entries.length === 0) return [];

    // 1) Cria as que faltam (ignora as já existentes via @@unique([userId, name])).
    await prisma.subject.createMany({
      data: entries.map((entry) => ({
        userId,
        name: entry.name,
        color: entry.color,
      })),
      skipDuplicates: true,
    });

    // 2) Aplica a cor em todas, agrupando por cor: um updateMany por cor distinta
    //    (limitado pela paleta, não cresce com o nº de matérias).
    const namesByColor = new Map<string, string[]>();
    for (const entry of entries) {
      const names = namesByColor.get(entry.color) ?? [];
      names.push(entry.name);
      namesByColor.set(entry.color, names);
    }
    await Promise.all(
      [...namesByColor.entries()].map(([color, names]) =>
        prisma.subject.updateMany({
          where: { userId, name: { in: names } },
          data: { color },
        }),
      ),
    );

    // 3) Devolve todas com id.
    return prisma.subject.findMany({
      where: { userId, name: { in: entries.map((entry) => entry.name) } },
    });
  }
}
