"use client";

import { createContext, useContext } from "react";

/**
 * Modo foco: engajado ao iniciar uma sessão de estudo. Colapsa a sidebar e a
 * lista de disciplinas para uma tela de concentração. `revealed` permite
 * revelar temporariamente a navegação sem sair do foco. Colapso efetivo =
 * `focus && !revealed`.
 */
export interface FocusModeValue {
  focus: boolean;
  setFocus: (value: boolean) => void;
  revealed: boolean;
  setRevealed: (value: boolean) => void;
}

const FocusModeContext = createContext<FocusModeValue | null>(null);

export const FocusModeProvider = FocusModeContext.Provider;

export function useFocusMode(): FocusModeValue {
  const value = useContext(FocusModeContext);
  if (!value) {
    throw new Error("useFocusMode deve ser usado dentro de FocusModeProvider");
  }
  return value;
}
