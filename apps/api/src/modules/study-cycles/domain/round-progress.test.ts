import { describe, expect, it } from "vitest";
import { isConcluded } from "./round-progress";

describe("isConcluded", () => {
  it("conclui quando o estudado alcança o planejado", () => {
    expect(isConcluded(2700, 45)).toBe(true); // 45min = 2700s
    expect(isConcluded(2699, 45)).toBe(false);
    expect(isConcluded(3600, 45)).toBe(true);
  });
});
