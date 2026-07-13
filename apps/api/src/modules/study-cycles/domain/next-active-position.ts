interface PositionedItem {
  isActive: boolean;
}

/**
 * Próxima posição de um item ativo após `currentPosition`, com wrap-around.
 * Se não houver nenhum item ativo, mantém a posição atual.
 */
export function nextActivePosition(
  items: PositionedItem[],
  currentPosition: number,
): number {
  if (items.length === 0) {
    return 0;
  }
  for (let step = 1; step <= items.length; step += 1) {
    const candidate = (currentPosition + step) % items.length;
    if (items[candidate].isActive) {
      return candidate;
    }
  }
  return currentPosition;
}

/**
 * Primeira posição de um item ativo a partir de `from` (inclusive), com
 * wrap-around. Usado para posicionar o cursor num item válido após editar.
 */
export function firstActivePosition(
  items: PositionedItem[],
  from = 0,
): number {
  if (items.length === 0) {
    return 0;
  }
  for (let step = 0; step < items.length; step += 1) {
    const candidate = (from + step) % items.length;
    if (items[candidate].isActive) {
      return candidate;
    }
  }
  return 0;
}
