import { NotFoundError } from "../../../shared/errors/AppError";
import type {
  StudyCycleRepository,
  StudyCycleWithItems,
} from "../domain/study-cycle";

export class GetCycleUseCase {
  constructor(private readonly cycles: StudyCycleRepository) {}

  async execute(userId: string, cycleId: string): Promise<StudyCycleWithItems> {
    const cycle = await this.cycles.findByIdWithItems(userId, cycleId);
    if (!cycle) {
      throw new NotFoundError("Ciclo de estudos");
    }
    return cycle;
  }
}
