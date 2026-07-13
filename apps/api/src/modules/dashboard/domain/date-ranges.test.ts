import { describe, expect, it } from "vitest";
import { startOfDay, startOfMonth, startOfWeek } from "./date-ranges";

/** Lê o relógio de parede (SP) de um instante, para asserts independentes de offset. */
function spParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}:${get("second")}`,
    weekday: get("weekday"),
  };
}

describe("date-ranges (fuso America/Sao_Paulo)", () => {
  it("startOfDay: estudo às 23h BRT conta no dia local, não no dia UTC seguinte", () => {
    // 2026-07-14T02:00:00Z === 2026-07-13 23:00 em SP (UTC-3).
    const lateNight = new Date("2026-07-14T02:00:00Z");
    // Início do dia 13 em SP = 2026-07-13T00:00-03:00 = 2026-07-13T03:00:00Z.
    expect(startOfDay(lateNight).toISOString()).toBe("2026-07-13T03:00:00.000Z");
    // endedAt (02:00Z do dia 14) >= início (03:00Z do dia 13) → cai em "hoje" (13).
    expect(lateNight.getTime()).toBeGreaterThanOrEqual(
      startOfDay(lateNight).getTime(),
    );
  });

  it("startOfDay: sempre 00:00:00 SP e mesma data-calendário SP do instante", () => {
    const d = new Date("2026-03-10T15:20:00Z");
    const start = spParts(startOfDay(d));
    expect(start.time).toBe("00:00:00");
    expect(start.date).toBe(spParts(d).date);
  });

  it("startOfMonth: dia 01 00:00 SP do mês local", () => {
    // 2026-07-01T02:00:00Z === 2026-06-30 23:00 SP → mês local é junho.
    const d = new Date("2026-07-01T02:00:00Z");
    expect(startOfMonth(d).toISOString()).toBe("2026-06-01T03:00:00.000Z");
    const start = spParts(startOfMonth(d));
    expect(start.time).toBe("00:00:00");
    expect(start.date.endsWith("-01")).toBe(true);
  });

  it("startOfWeek: segunda-feira 00:00 SP, no máximo 7 dias antes do instante", () => {
    const d = new Date("2026-07-16T10:00:00Z"); // quinta em SP
    const start = startOfWeek(d);
    const p = spParts(start);
    expect(p.weekday).toBe("Mon");
    expect(p.time).toBe("00:00:00");
    const diffDays = (d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeGreaterThanOrEqual(0);
    expect(diffDays).toBeLessThan(7);
  });
});
