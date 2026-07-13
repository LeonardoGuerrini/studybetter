import { describe, expect, it } from "vitest";
import { calculateStreak } from "./calculate-streak";

describe("calculateStreak", () => {
  const today = "2026-07-04";

  it("retorna 0 sem sessões finalizadas", () => {
    expect(calculateStreak([], today)).toBe(0);
  });

  it("conta dias consecutivos terminando hoje", () => {
    const days = ["2026-07-02", "2026-07-03", "2026-07-04"];
    expect(calculateStreak(days, today)).toBe(3);
  });

  it("mantém o streak se hoje ainda não estudou (conta a partir de ontem)", () => {
    const days = ["2026-07-02", "2026-07-03"];
    expect(calculateStreak(days, today)).toBe(2);
  });

  it("zera quando há um dia de intervalo", () => {
    const days = ["2026-07-01", "2026-07-02"];
    expect(calculateStreak(days, today)).toBe(0);
  });

  it("ignora dias duplicados e não consecutivos", () => {
    const days = ["2026-06-28", "2026-07-03", "2026-07-03", "2026-07-04"];
    expect(calculateStreak(days, today)).toBe(2);
  });

  it("cruza a virada de mês corretamente", () => {
    const days = ["2026-06-30", "2026-07-01"];
    expect(calculateStreak(days, "2026-07-01")).toBe(2);
  });
});
