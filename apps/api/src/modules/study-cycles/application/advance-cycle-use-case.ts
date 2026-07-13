import { NotFoundError } from "../../../shared/errors/AppError";
import { nextActivePosition } from "../domain/next-active-position";
import type {
  StudyCycleRepository,
  StudyCycleWithItems,
} from "../domain/study-cycle";

export class AdvanceCycleUseCase {
  constructor(private readonly cycles: StudyCycleRepository) {}

  async execute(userId: string): Promise<StudyCycleWithItems> {
    const cycle = await this.cycles.findActiveByUser(userId);
    if (!cycle || cycle.items.length === 0) {
      throw new NotFoundError("Ciclo de estudos ativo");
    }

    const nextPosition = nextActivePosition(cycle.items, cycle.currentPosition);
    if (nextPosition !== cycle.currentPosition) {
      await this.cycles.updatePosition(cycle.id, nextPosition);
    }
    return { ...cycle, currentPosition: nextPosition };
  }
}
