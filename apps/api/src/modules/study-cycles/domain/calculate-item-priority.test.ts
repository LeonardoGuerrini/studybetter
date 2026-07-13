import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../shared/errors/AppError";
import { calculateItemPriority } from "./calculate-item-priority";

describe("calculateItemPriority", () => {
  it("aplica a fórmula weight * (6 - knowledgeLevel)", () => {
    expect(calculateItemPriority(5, 1)).toBe(25); // máxima prioridade
    expect(calculateItemPriority(1, 5)).toBe(1); // mínima prioridade
    expect(calculateItemPriority(3, 3)).toBe(9);
    expect(calculateItemPriority(4, 2)).toBe(16);
  });

  it("rejeita valores fora da escala 1..5", () => {
    expect(() => calculateItemPriority(0, 3)).toThrow(ValidationError);
    expect(() => calculateItemPriority(6, 3)).toThrow(ValidationError);
    expect(() => calculateItemPriority(3, 0)).toThrow(ValidationError);
    expect(() => calculateItemPriority(3, 6)).toThrow(ValidationError);
  });

  it("rejeita valores não inteiros", () => {
    expect(() => calculateItemPriority(2.5, 3)).toThrow(ValidationError);
    expect(() => calculateItemPriority(3, 2.5)).toThrow(ValidationError);
  });
});
