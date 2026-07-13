import { describe, expect, it } from "vitest";
import { firstActivePosition, nextActivePosition } from "./next-active-position";

const items = (flags: boolean[]) => flags.map((isActive) => ({ isActive }));

describe("nextActivePosition", () => {
  it("avança para o próximo item ativo", () => {
    expect(nextActivePosition(items([true, true, true]), 0)).toBe(1);
  });

  it("pula itens inativos", () => {
    expect(nextActivePosition(items([true, false, false, true]), 0)).toBe(3);
  });

  it("faz wrap-around até o primeiro ativo", () => {
    expect(nextActivePosition(items([true, false, false]), 0)).toBe(0);
    expect(nextActivePosition(items([true, true, false]), 1)).toBe(0);
  });

  it("mantém a posição quando não há nenhum ativo", () => {
    expect(nextActivePosition(items([false, false]), 1)).toBe(1);
  });

  it("retorna 0 para lista vazia", () => {
    expect(nextActivePosition([], 0)).toBe(0);
  });
});

describe("firstActivePosition", () => {
  it("acha o primeiro ativo a partir de `from` (inclusive)", () => {
    expect(firstActivePosition(items([true, true, true]), 1)).toBe(1);
    expect(firstActivePosition(items([false, false, true]), 0)).toBe(2);
  });

  it("faz wrap-around quando `from` cai em item inativo no fim", () => {
    expect(firstActivePosition(items([true, false, false]), 2)).toBe(0);
  });

  it("retorna 0 quando não há ativo", () => {
    expect(firstActivePosition(items([false, false]), 0)).toBe(0);
  });
});
