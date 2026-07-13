import { NotFoundError } from "../../../shared/errors/AppError";
import type { StudyCycleRepository } from "../domain/study-cycle";

export class DeleteCycleUseCase {
  constructor(private readonly cycles: StudyCycleRepository) {}

  async execute(userId: string, cycleId: string): Promise<void> {
    const cycle = await this.cycles.findByIdWithItems(userId, cycleId);
    if (!cycle) {
      throw new NotFoundError("Ciclo de estudos");
    }
    await this.cycles.delete(userId, cycleId);
  }
}
