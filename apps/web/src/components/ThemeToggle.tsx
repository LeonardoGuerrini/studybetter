"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

/** Alterna tema claro/escuro (classe `.light` no <html>), persistido em localStorage. */
export function ThemeToggle({ expanded = false }: { expanded?: boolean }) {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem("sb-theme", next ? "light" : "dark");
    } catch {
      /* ignore */
    }
  }

  const Icon = light ? Moon : Sun;
  const label = light ? "Tema escuro" : "Tema claro";

  if (expanded) {
    return (
      <button
        onClick={toggle}
        aria-label={label}
        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-faint transition hover:bg-surface hover:text-ink"
      >
        <Icon size={18} className="shrink-0" />
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      className="flex h-11 w-11 items-center justify-center rounded-[10px] text-faint transition hover:bg-surface hover:text-ink"
    >
      <Icon size={18} />
    </button>
  );
}
