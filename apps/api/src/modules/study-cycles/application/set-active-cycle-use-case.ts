import { NotFoundError } from "../../../shared/errors/AppError";
import type {
  StudyCycleRepository,
  StudyCycleWithItems,
} from "../domain/study-cycle";

export class SetActiveCycleUseCase {
  constructor(private readonly cycles: StudyCycleRepository) {}

  async execute(userId: string, cycleId: string): Promise<StudyCycleWithItems> {
    const cycle = await this.cycles.findByIdWithItems(userId, cycleId);
    if (!cycle) {
      throw new NotFoundError("Ciclo de estudos");
    }
    await this.cycles.setActive(userId, cycleId);
    return { ...cycle, isActive: true };
  }
}
