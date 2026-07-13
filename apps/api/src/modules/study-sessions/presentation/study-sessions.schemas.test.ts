import { describe, expect, it } from "vitest";
import { finishSessionSchema } from "./study-sessions.schemas";

const base = {
  netMinutes: 60,
  studyDate: new Date().toISOString(),
  studyPeriod: "MORNING",
  studyMethod: "PDF",
};

describe("finishSessionSchema (limites de entrada)", () => {
  it("aceita um registro válido", () => {
    expect(finishSessionSchema.safeParse(base).success).toBe(true);
  });

  it("rejeita netMinutes acima de 24h (anti-overflow do Int)", () => {
    expect(
      finishSessionSchema.safeParse({ ...base, netMinutes: 99999999 }).success,
    ).toBe(false);
    expect(
      finishSessionSchema.safeParse({ ...base, netMinutes: 1441 }).success,
    ).toBe(false);
    expect(
      finishSessionSchema.safeParse({ ...base, netMinutes: 1440 }).success,
    ).toBe(true);
  });

  it("rejeita contadores absurdos", () => {
    expect(
      finishSessionSchema.safeParse({ ...base, questionsCount: 100001 }).success,
    ).toBe(false);
  });

  it("rejeita studyDate muito no futuro", () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      finishSessionSchema.safeParse({ ...base, studyDate: future }).success,
    ).toBe(false);
  });

  it("rejeita acertos maiores que questões", () => {
    expect(
      finishSessionSchema.safeParse({
        ...base,
        questionsCount: 10,
        correctCount: 11,
      }).success,
    ).toBe(false);
  });
});
