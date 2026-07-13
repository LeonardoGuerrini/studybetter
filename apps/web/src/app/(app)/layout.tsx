"use client";

import {
  BarChart3,
  Clock,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { api } from "@/lib/api";
import { FocusModeProvider } from "@/lib/focus-mode";
import type { User } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/study", label: "Estudar", icon: Play },
  { href: "/cycles", label: "Ciclos", icon: RefreshCw },
];

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [focus, setFocus] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Modo foco (ligado ao iniciar uma sessão) colapsa a navegação; `revealed`
  // reexpande temporariamente sem sair do foco.
  const focusCollapsed = focus && !revealed;
  const showExpanded = expanded && !focusCollapsed;

  // Auth já é garantida pelo middleware (checa o cookie antes de renderizar).
  // Aqui só buscamos o usuário p/ o UserMenu — sem gatear o render dos children,
  // então o fetch de dados de cada página roda em paralelo com este.
  useEffect(() => {
    const controller = new AbortController();
    api
      .get<{ user: User }>("/users/me", controller.signal)
      .then((data) => setUser(data.user))
      .catch(() => {
        /* AbortError no unmount ou 401 (redirect global em api.ts) — ignorar. */
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem("sb-sidebar") === "collapsed") setExpanded(false);
    } catch {
      /* ignore */
    }
  }, []);

  function toggleSidebar() {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sb-sidebar", next ? "expanded" : "collapsed");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  async function handleLogout() {
    await api.post("/auth/logout");
    router.replace("/login");
  }

  // value estável: consumidores de useFocusMode() só re-renderizam quando muda.
  const focusValue = useMemo(
    () => ({ focus, setFocus, revealed, setRevealed }),
    [focus, revealed],
  );

  return (
    <FocusModeProvider value={focusValue}>
      <div className="min-h-screen bg-bg">
      {/* Sidebar desktop (expansível) */}
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-border bg-surface py-6 transition-[width] duration-200 md:flex ${
          showExpanded ? "w-60 px-4" : "w-[72px] items-center px-0"
        }`}
      >
        {/* Cabeçalho: logo + nome + toggle */}
        <div
          className={`mb-6 flex items-center ${
            showExpanded ? "justify-between" : "flex-col gap-3"
          }`}
        >
          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-accent text-accent-ink">
              <Clock size={20} strokeWidth={2.5} />
            </span>
            {showExpanded && (
              <span className="whitespace-nowrap text-[15px] font-bold tracking-tight">
                Study Better
              </span>
            )}
          </span>
          {!focusCollapsed && (
            <button
              onClick={toggleSidebar}
              aria-label={expanded ? "Minimizar menu" : "Expandir menu"}
              title={expanded ? "Minimizar" : "Expandir"}
              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-faint transition hover:bg-raised hover:text-ink"
            >
              {expanded ? (
                <PanelLeftClose size={18} />
              ) : (
                <PanelLeftOpen size={18} />
              )}
            </button>
          )}
        </div>

        {/* Navegação */}
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={showExpanded ? undefined : item.label}
                aria-label={item.label}
                className={`flex items-center rounded-[10px] transition ${
                  showExpanded ? "gap-3 px-3 py-2.5" : "h-11 w-11 justify-center"
                } ${
                  active
                    ? "bg-raised text-accent-text"
                    : "text-faint hover:bg-raised hover:text-ink"
                }`}
              >
                <Icon size={19} className="shrink-0" />
                {showExpanded && (
                  <span className="whitespace-nowrap text-sm font-medium">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Rodapé: chip de perfil (abre menu com nome/email/tema/sair) */}
        <div className={showExpanded ? "" : "flex flex-col items-center"}>
          {user && (
            <UserMenu user={user} expanded={showExpanded} onLogout={handleLogout} />
          )}
        </div>
      </aside>

      {/* Barra inferior (mobile) — oculta no modo foco */}
      <nav
        className={`fixed inset-x-0 bottom-0 z-40 h-[72px] items-center justify-around border-t border-border bg-surface px-2 md:hidden ${
          focusCollapsed ? "hidden" : "flex"
        }`}
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`flex flex-col items-center gap-1 rounded-[10px] px-3 py-1.5 text-[10px] font-medium transition ${
                active ? "text-accent-text" : "text-faint"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
        <ThemeToggle />
        <button
          onClick={handleLogout}
          aria-label="Sair"
          className="flex h-11 w-11 items-center justify-center rounded-[10px] text-faint transition hover:bg-raised hover:text-ink"
        >
          <LogOut size={17} />
        </button>
      </nav>

      <main
        className={`px-5 pb-[92px] pt-6 transition-[padding] duration-200 md:pb-12 ${
          showExpanded ? "md:pl-[240px]" : "md:pl-[72px]"
        }`}
      >
        <div className="px-0 md:px-8 lg:px-12">{children}</div>
      </main>
      </div>
    </FocusModeProvider>
  );
}
