# CLAUDE.md — Study Better (monorepo)

> **REGRA DE MANUTENÇÃO (obrigatória).** Estes `CLAUDE.md` são o contexto que agentes de IA usam para
> entender o projeto, seguir o padrão e **não alucinar**. **Toda nova funcionalidade, alteração ou
> decisão DEVE ser documentada** no `CLAUDE.md` da área afetada, na mesma tarefa:
> - mudou o backend → `apps/api/CLAUDE.md`;
> - mudou o frontend → `apps/web/CLAUDE.md`;
> - mudou setup/estrutura/execução do monorepo → **este** arquivo.
> Sempre adicione uma linha no **Changelog** correspondente. Antes de codar, **leia** o `CLAUDE.md` da
> área. Se o doc divergir do código, o código é a verdade — corrija o doc.

---

## O que é

**Study Better** — gerenciador de estudos: o usuário cria conta, monta **ciclos de estudo** (matérias
com peso, nível de conhecimento e tempo), estuda com **timer** (iniciar/pausar/retomar/finalizar),
acompanha o **progresso da rodada** por matéria e vê um **dashboard** de evolução. Estado: **MVP
funcional** rodando localmente.

## Estrutura (npm workspaces)

```
StudyBetter/
├── CLAUDE.md            ← este arquivo (visão geral do monorepo)
├── README.md           ← instruções de setup para humanos
├── docker-compose.yml  ← Postgres (dev) + build completo (profile "full")
├── package.json        ← workspaces: apps/*
└── apps/
    ├── api/            ← backend  (Express + Prisma) — ver apps/api/CLAUDE.md
    └── web/            ← frontend (Next.js)          — ver apps/web/CLAUDE.md
```

## Stack

- **Backend** (`apps/api`): Node.js, Express 5, TypeScript (ESM, sem build, roda via `tsx`), Prisma +
  PostgreSQL, Zod, JWT em cookie httpOnly (bcryptjs), Vitest. Porta **3001**, rotas sob `/api`.
- **Frontend** (`apps/web`): Next.js 15 (App Router), React 19, TailwindCSS 4, TypeScript strict.
  Porta **3000**. Consome a API via `fetch` com cookie (`credentials:"include"`).
- **Banco**: PostgreSQL. Em **dev**, porta **5432** (`dev:db` sobe um Postgres embutido sem Docker, ou
  `docker compose up -d db`). Em **produção**, banco gerenciado no **Supabase** (a API segue hospedada
  à parte, no Render); detalhes de conexão (pooler 6543 / session 5432) em `apps/api/CLAUDE.md`.
- **CORS**: a API libera a origem `http://localhost:3000` com `credentials:true`. **Rode o web na
  3000**, senão o cookie/CORS falha.

## Como rodar (dev)

```bash
npm install
# 1) Banco (deixe rodando em um terminal):
npm run dev:db  -w apps/api          # Postgres embutido (sem Docker)  — ou: docker compose up -d db
# 2) Migrações (primeira vez / após mudança de schema):
cd apps/api && npx prisma migrate dev && cd ../..
# 3) App:
npm run dev:api                       # API  em http://localhost:3001
npm run dev:web                       # Web  em http://localhost:3000
# Qualidade:
npm test                              # testes de domínio do backend (Vitest)
npm run typecheck                     # typecheck de api + web
```

Notas de ambiente: `apps/api/.env` (`DATABASE_URL`, `JWT_SECRET` ≥32 chars, `PORT`, `WEB_ORIGIN`) e
`apps/web/.env.local` (`NEXT_PUBLIC_API_URL`). Reset destrutivo de banco (`prisma migrate reset`) exige
**consentimento explícito do usuário**.

## Documentos por área (leia antes de mexer)

- Backend: [`apps/api/CLAUDE.md`](apps/api/CLAUDE.md) — arquitetura modular, módulos, modelo de dados,
  endpoints, regras de domínio, decisões, como adicionar caso de uso.
- Frontend: [`apps/web/CLAUDE.md`](apps/web/CLAUDE.md) — App Router, `lib/` (api/types/format/hooks),
  componentes, páginas/fluxos, padrão staged, decisões.

## Changelog (alto nível)

- **MVP** → **Construtor de ciclos manual** (ciclos montados à mão; aba Matérias removida) → **Tela
  Estudar estilo GranCursos + reinícios de ciclo/disciplina** → **Documentação de contexto para IA**
  (estes `CLAUDE.md`) → **Registro de estudo (timer + manual)** → **Redesign "Deep Work"** (dark-first
  com tema claro/escuro, rail lateral, ícones Lucide, fontes Space Grotesk/IBM Plex Mono, tela Estudar
  como centro de comando com anel de progresso) → **Banco de produção no Supabase** (cutover do
  Postgres do Render para o Supabase; a API continua no Render) → **Redesign "Papel"** (nova direção
  editorial claro/escuro: base papel/carvão, accent terracota, tipografia serifada Newsreader + Hanken
  Grotesk + Space Mono) → **Performance (SSR-first + optimistic timer)** (front migrou o carregamento
  inicial das telas para Server Components buscando na API server-side — fim do spinner-após-montar e do
  round-trip visível a cada navegação; timer com optimistic update; backend paraleliza as leituras do
  start-session) → **Segurança & precisão** (revisão de código: agregações do dashboard no fuso de
  Brasília, limites de entrada anti-overflow, rate limiting + helmet no login, e índice único garantindo
  uma sessão aberta por usuário). Detalhes nos changelogs de cada área.
