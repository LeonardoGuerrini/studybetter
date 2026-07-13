"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/register", { name, email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar");
      setLoading(false);
    }
  }

  const labelClass =
    "block font-mono text-xs font-semibold uppercase tracking-wider text-muted";
  const inputClass =
    "mt-2 w-full rounded-[10px] border border-border-strong bg-surface px-4 py-3 text-[15px] text-ink outline-none transition focus:border-accent focus:ring-[3px] focus:ring-accent-soft";

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-bg px-6 text-ink">
      <div className="absolute left-6 top-6 flex items-center gap-2.5 md:left-12 md:top-12">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-ink">
          <Clock size={18} strokeWidth={2.5} />
        </span>
        <span className="text-[17px] font-bold tracking-tight">Study Better</span>
      </div>

      <div className="hidden md:absolute md:bottom-12 md:left-12 md:right-12 md:flex md:justify-between">
        <span className="font-mono text-xs text-faint">ciclos priorizados</span>
        <span className="font-mono text-xs text-faint">timer persistente</span>
        <span className="font-mono text-xs text-faint">constância visível</span>
      </div>

      <div className="w-full max-w-[400px]">
        <h1 className="font-serif text-[34px] font-medium tracking-[-0.02em]">Criar conta</h1>
        <p className="mt-2.5 text-sm text-muted">
          Crie sua conta e organize seus estudos.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label htmlFor="name" className={labelClass}>
              Nome
            </label>
            <input
              id="name"
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
            />
            <p className="mt-1.5 font-mono text-xs text-faint">
              Mínimo de 8 caracteres
            </p>
          </div>

          {error && (
            <p className="rounded-[10px] bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-[10px] bg-accent py-3.5 text-[15px] font-bold text-accent-ink transition hover:brightness-95 disabled:opacity-60"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-accent-text hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
