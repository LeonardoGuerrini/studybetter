import type { CycleSummary, StudyCycleRepository } from "../domain/study-cycle";

export class ListCyclesUseCase {
  constructor(private readonly cycles: StudyCycleRepository) {}

  execute(userId: string): Promise<CycleSummary[]> {
    return this.cycles.listByUser(userId);
  }
}
