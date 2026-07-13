export interface Subject {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Nome + cor de uma matéria a resolver (reaproveitar ou criar). */
export interface SubjectNameColor {
  name: string;
  color: string;
}

export interface SubjectRepository {
  findById(userId: string, id: string): Promise<Subject | null>;
  listByUser(userId: string): Promise<Subject[]>;
  /**
   * Resolve várias matérias de uma vez (reaproveita as existentes por userId+name,
   * cria as que faltam) e aplica a `color` informada em todas — permite trocar a cor
   * ao editar o ciclo. Feito em poucas queries (sem N+1). Os nomes devem ser únicos.
   */
  resolveManyByName(
    userId: string,
    entries: SubjectNameColor[],
  ): Promise<Subject[]>;
}
