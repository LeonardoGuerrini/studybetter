"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { User } from "@/lib/types";

/**
 * Chip de perfil no rodapé da sidebar. Ao clicar, abre um popover com nome
 * completo, e-mail, opção de tema (claro/escuro) e o botão de sair.
 */
export function UserMenu({
  user,
  expanded,
  onLogout,
}: {
  user: User;
  expanded: boolean;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="relative">
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 z-50 mb-2 w-60 overflow-hidden rounded-[12px] border border-border bg-surface shadow-xl">
            <div className="flex items-center gap-3 border-b border-border p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-border-strong text-sm font-bold text-ink">
                {initial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {user.name}
                </p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
            </div>
            <div className="p-1.5">
              <ThemeToggle expanded />
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-danger/10"
              >
                <LogOut size={18} className="shrink-0" />
                Sair
              </button>
            </div>
          </div>
        </>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Menu do usuário"
        title={expanded ? undefined : user.name}
        aria-expanded={open}
        className={`flex w-full items-center rounded-[10px] transition hover:bg-raised ${
          expanded ? "gap-3 px-3 py-2.5" : "h-11 w-11 justify-center"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-border-strong text-[13px] font-bold text-ink">
          {initial}
        </span>
        {expanded && (
          <>
            <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-ink-secondary">
              {user.name}
            </span>
            <ChevronsUpDown size={15} className="shrink-0 text-faint" />
          </>
        )}
      </button>
    </div>
  );
}
