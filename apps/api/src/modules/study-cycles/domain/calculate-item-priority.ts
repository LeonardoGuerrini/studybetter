import { ValidationError } from "../../../shared/errors/AppError";

export const MIN_SCALE = 1;
export const MAX_SCALE = 5;

function assertScale(value: number, field: string): void {
  if (!Number.isInteger(value) || value < MIN_SCALE || value > MAX_SCALE) {
    throw new ValidationError({
      [field]: [`Deve ser um inteiro entre ${MIN_SCALE} e ${MAX_SCALE}`],
    });
  }
}

/**
 * priorityScore = weight * (6 - knowledgeLevel)
 * Quanto maior o peso e menor o conhecimento, maior a prioridade (1..25).
 */
export function calculateItemPriority(
  weight: number,
  knowledgeLevel: number,
): number {
  assertScale(weight, "weight");
  assertScale(knowledgeLevel, "knowledgeLevel");
  return weight * (MAX_SCALE + 1 - knowledgeLevel);
}
