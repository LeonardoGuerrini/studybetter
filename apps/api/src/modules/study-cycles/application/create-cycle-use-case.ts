import type { StudyCycle, StudyCycleRepository } from "../domain/study-cycle";

interface CreateCycleInput {
  userId: string;
  name: string;
}

export class CreateCycleUseCase {
  constructor(private readonly cycles: StudyCycleRepository) {}

  async execute({ userId, name }: CreateCycleInput): Promise<StudyCycle> {
    const existingCount = await this.cycles.countByUser(userId);
    // O primeiro ciclo do usuário já nasce ativo (não há outro concorrendo).
    return this.cycles.create(userId, name, existingCount === 0);
  }
}
