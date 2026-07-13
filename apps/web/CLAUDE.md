# CLAUDE.md — Frontend (`apps/web`)

> **REGRA DE MANUTENÇÃO (obrigatória).** Este arquivo é a fonte de contexto para agentes de IA
> trabalharem no frontend. **Toda nova página, componente, alteração de fluxo ou decisão DEVE ser
> registrada aqui** na mesma tarefa em que for feita:
> - rota/página nova → **Estrutura do App Router** e **Páginas & fluxos**;
> - componente/hook/util → **`components/`** ou **`lib/`**;
> - tipo novo/alterado → **`lib/types.ts`** (mantê-lo alinhado ao DTO do backend);
> - decisão técnica → **Decisões**; e sempre uma linha no **Changelog**.
> Não deixe o documento divergir do código. **Não invente** nomes de arquivos/props/rotas — confira.
> Os tipos e rotas aqui devem casar com o backend: veja `apps/api/CLAUDE.md`.

---

## 1. Stack

**Next.js 15 (App Router)** · **React 19** · **TailwindCSS 4** (via `@tailwindcss/postcss`; sem
`tailwind.config`) · **TypeScript strict** (alias `@/* → src/*`) · **lucide-react** (ícones — nunca emoji).
**Data fetching híbrido (SSR-first)**: o **carregamento inicial** de cada tela é feito em **Server
Components** (`page.tsx` `async`, fetch server→server via `lib/api-server.ts`, HTML já vem com os dados
— sem spinner-após-montar); a **interatividade** (timer, edições, mutações) vive em client components
que ou recebem os dados iniciais **por props** (`/study`, `/cycles/[id]`) ou revalidam o RSC via
`router.refresh()` (`/dashboard`, `/cycles`). Não há server actions nem API routes. Os dados vêm
**exclusivamente** da API Express, autenticados por cookie.

### Design system "Papel" (dark-first, editorial)
- **Tokens de tema** em `globals.css`: `@theme inline` mapeia utilitários (`bg-bg`, `bg-surface`,
  `bg-raised`, `bg-track`, `border-border`/`border-border-strong`, `text-ink`/`text-ink-secondary`/
  `text-muted`/`text-faint`, `bg-accent`/`text-accent-ink`/`bg-accent-soft`/`text-accent-text`,
  `text-danger`) para as variáveis `--sb-*`. **Escuro é o padrão** (`:root`, carvão quente); **claro**
  (papel) sobrescreve em `html.light`. **Use sempre os tokens** (nunca hex direto, exceto as cores de
  matéria vindas do backend). `--sb-track` é o **trilho de barra** (levemente distinto de `border`),
  usado nas barras do dashboard e nos segmentos não-estudados da fila.
- **Accent** = terracota (`--sb-accent` `#B4552D` no claro / `#CE7048` no escuro; texto sobre accent
  `--sb-accent-ink`; como texto usa `text-accent-text` = `#B4552D` claro / `#E08A5E` escuro).
  **Marcadores de matéria** = quadrados `rounded-[2px|3px]` (nunca círculos).
- **Fontes** via `next/font/google` no `layout.tsx` raiz: **Newsreader** (`font-serif`, títulos de
  página e números grandes — pesos 400/500/600), **Hanken Grotesk** (`font-sans`, UI/corpo/labels) e
  **Space Mono** (`font-mono`, timers/micro-labels/metas — 400/700). Aplique `font-serif` em títulos de
  página e números grandes (StatCard, `<h1>` do dashboard, nomes serifados); timers seguem `font-mono`.
  Raios: cards `rounded-2xl` (16px), botões/inputs `rounded-[10px]`, botões grandes do timer
  `rounded-[15px]`, pílulas `rounded-full`.
- **Tema**: `ThemeToggle` alterna a classe `.light` no `<html>` e persiste em `localStorage['sb-theme']`;
  um script inline no `<head>` do layout raiz aplica o tema antes da pintura (sem flash).

Porta padrão: **3000**. A API é lida de `NEXT_PUBLIC_API_URL`. Em **dev**, `.env.local` →
`http://localhost:3001/api` (chamada direta). Em **produção**, `NEXT_PUBLIC_API_URL=/api` (relativo):
o `next.config.ts` faz **rewrite (proxy)** de `/api/*` para a API (env `API_ORIGIN`, ex.: a URL do
Render). Isso deixa front e API no **mesmo origin** — essencial porque o cookie de sessão é httpOnly e,
com front (Vercel) e API (Render) em domínios distintos, seria um **cookie third-party bloqueado** pelo
navegador. Como `NEXT_PUBLIC_*` é inlined em build, o valor entra por env de build no host do front.

## 2. Estrutura do App Router (`src/app`)

- **`layout.tsx`** (raiz, server): `metadata`, `<html lang="pt-BR">`, importa `globals.css`. Body:
  `min-h-screen bg-slate-100 text-slate-900 antialiased`.
- **`globals.css`**: apenas `@import "tailwindcss";`.
- **`page.tsx`** (raiz, server): `redirect("/dashboard")`.
- **`(app)/error.tsx`** (`"use client"`): error boundary das rotas autenticadas — cobre falha/timeout do
  fetch server-side (`api-server.ts`); mostra mensagem + botão "tentar de novo" (`reset()`). O redirect de
  401 não cai aqui (é navegação, não erro).
- **Grupo `(auth)`** (público, sem layout próprio): `/login`, `/register`.
- **Grupo `(app)`** (protegido, com `layout.tsx` de guarda + **rail lateral de 72px**): `/dashboard`,
  `/study`, `/cycles`, `/cycles/[id]`.

Os parênteses dos grupos **não** aparecem na URL.

### Guarda de auth — `src/middleware.ts` + `(app)/layout.tsx`
- **`middleware.ts`** (edge) é a guarda principal: checa a **presença** do cookie `studybetter_token`;
  sem cookie em rota protegida (`/dashboard`, `/study`, `/cycles/*`) → redireciona `/login`. **Só isso**
  — de propósito **não** redireciona quem tem cookie para fora de `/login` (isso criava um loop com o
  redirect de 401: cookie inválido → `/dashboard` 401 → `/login` → middleware devolve pra `/dashboard`).
  Não valida o JWT (token inválido/expirado é tratado pelo 401 global em `lib/api.ts`, que manda pro
  `/login` — sempre acessível).
- `(app)/layout.tsx` (`"use client"`) **não gateia mais** o render dos children: busca `/users/me` no
  mount (com `AbortController`) só para popular o `UserMenu` (renderizado quando `user` existe). Assim o
  fetch de dados de cada página roda **em paralelo** com o `/users/me` (sem waterfall). O
  `FocusModeProvider` recebe um `value` memoizado (`useMemo`).
- **Sidebar expansível** (desktop, ícones Lucide): **expandida (240px) por padrão**, minimizável (72px)
  pelo botão `PanelLeftClose`/`PanelLeftOpen` no topo; estado persistido em `localStorage['sb-sidebar']`
  (`expanded`/`collapsed`). **Modo foco**: o layout provê o `FocusModeProvider` (`lib/focus-mode`); quando
  `focus && !revealed`, força a sidebar minimizada (72px) e esconde a barra inferior mobile + o toggle
  manual, **sem** alterar a preferência `expanded` persistida (volta ao normal ao sair do foco). Largura
  da `<aside>` e padding do `<main>` derivam de `showExpanded = expanded && !focusCollapsed`. Logo `Clock` (+ "Study Better" quando expandida); `NAV_ITEMS`
  `Dashboard (BarChart3)`, `Estudar (Play)`, `Ciclos (RefreshCw)` — mostram **o nome da seção quando
  expandida**, só ícone + tooltip quando minimizada; ativo `bg-raised text-accent-text` via
  `usePathname().startsWith(href)`. Rodapé: **chip de perfil** (`UserMenu`) — avatar + nome (+ chevron
  quando expandida); ao clicar abre um popover acima com **nome completo, e-mail, opção de tema
  (claro/escuro via `ThemeToggle`) e Sair**. O `<main>` ajusta o padding esquerdo
  (`md:pl-[240px]`/`md:pl-[72px]`).
  **Responsivo**: abaixo de `md` vira **barra inferior fixa** horizontal (ícones only, sem expandir).
- Logout: `api.post("/auth/logout")` → `router.replace("/login")`.

## 3. `lib/`

- **`api-server.ts`** — cliente HTTP para **Server Components** (`apiServer<T>(path)`). Lê o cookie de
  sessão via `next/headers` e faz `fetch` **direto** no `API_ORIGIN` do backend (server→server, sem
  proxy/CORS), encaminhando `Cookie: studybetter_token=...`. `cache:"no-store"` (dado por-usuário → rota
  dinâmica); **401** → `redirect("/login")`; `signal: AbortSignal.timeout(10s)` (não pendura o SSR no cold
  start do Render → cai no `error.tsx`). `API_ORIGIN` = env do host; fallback: Render em produção,
  `http://localhost:3001` em dev. **Só pode ser importado em Server Components** (usa `next/headers`).
  Encode o valor dinâmico ao montar o path (`/study-cycles/${encodeURIComponent(id)}`).
- **`api.ts`** — cliente HTTP único (**client-side**; usado nas mutações e recargas pós-mutação).
  - `BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"`.
  - `request<T>(path, method="GET", body?, signal?)`: `fetch` com **`credentials:"include"`** (envia o
    cookie), `Content-Type: application/json` só quando há body; passa `signal` (AbortController); `204`
    → `undefined`; se `!ok` lança **`ApiError(status, data?.error?.message ?? "Erro inesperado...")`**
    (casa com o envelope `{ error: { message } }` do backend). Em **401** fora das telas de auth,
    redireciona global p/ `/login` (cobre sessão expirada).
  - Métodos: `api.get/post/put/patch/del`. `get(path, signal?)` aceita AbortSignal (usado nos loaders
    com cleanup no unmount). `post`/`put` default body `{}`.
- **`types.ts`** — espelha os DTOs do backend. Interfaces: `User`, `Subject`, `SessionStatus`,
  `StudyMethod`/`StudyPeriod` (unions iguais aos enums do backend), `SubjectInfo`, `StudySession`
  (inclui `cycleId`, `cycleName`, `elapsedSeconds` + registro do estudo:
  `studyMethod/studyPeriod/studyDate/questionsCount/correctCount/pagesStudied`, todos nullable),
  `CycleItem`, `StudyCycle`, `ActiveCycleItem` (+`studiedSeconds`,`concluded`), `ActiveCycle`
  (+`totalStudiedSeconds`,`totalPlannedSeconds`), `CycleSummary`, `SubjectTimeSummary` (`seconds`),
  `DashboardSummary` (`totals.*Seconds`). **Ao mudar um DTO no backend, atualize aqui.**
- **`format.ts`** — `formatDuration(totalSeconds)` (`0min` / `45s` / `12min` / `2h 30min`; sessões < 1min
  mostram os segundos, nunca somem), `formatClock` (`HH:MM:SS` a partir de segundos), `formatDateTime` (pt-BR).
- **`use-session-timer.ts`** (`"use client"`) — `useSessionTimer(session)`: parte de
  `session.elapsedSeconds` (valor do servidor no fetch) e soma um delta local **só quando RUNNING**
  (tick de 1s). Assim o timer **sobrevive a reload** e congela quando pausado.
- **`focus-mode.tsx`** (`"use client"`) — Context + hook `useFocusMode()` do **modo foco**
  (`{ focus, setFocus, revealed, setRevealed }`). O `FocusModeProvider` vive no `(app)/layout.tsx`;
  a `/study` liga o foco ao iniciar/haver sessão. Colapso efetivo = `focus && !revealed` (`revealed`
  reexpande a navegação temporariamente sem sair do foco).

## 4. `components/`

- **`StatCard.tsx`** — `{ label, value, hint?, highlight? }`. Card de métrica (dashboard); `highlight`
  inverte em accent (card "Hoje").
- **`ProgressRing.tsx`** — `{ progress(0–1), children, size? }`. Anel single-arc em SVG (trilho `--sb-border`
  + arco `--sb-accent`, linecap round) usado na tela Estudar; `children` = timer + meta ao centro.
- **`ThemeToggle.tsx`** (`"use client"`) — botão Sol/Lua; alterna `.light` no `<html>` + persiste
  `localStorage['sb-theme']`. Prop `expanded` → renderiza como linha com rótulo (usado dentro do `UserMenu`).
- **`UserMenu.tsx`** (`"use client"`) — `{ user, expanded, onLogout }`. Chip de perfil do rodapé da
  sidebar; ao clicar abre popover com nome completo, e-mail, `ThemeToggle` e botão Sair (com backdrop
  para fechar).
- **`RestartSubjectModal.tsx`** — `{ subjectName, busy, onChoose("save"|"discard"), onCancel }`.
  Modal do reinício por matéria (Salvar / Descartar / Cancelar); explica que histórico/anotações são mantidos.
- **`PageLoader.tsx`** — `{ label? }`. Spinner centralizado (`animate-spin`) para estados de carregamento;
  **padrão único** de loading (substitui o texto "Carregando..." solto).
- **`ConfirmModal.tsx`** — `{ title, message, confirmLabel?, cancelLabel?, tone?("primary"|"danger"), busy?,
  onConfirm, onCancel }`. Modal genérico de confirmação que **substitui o `confirm()` nativo** (usado em
  reiniciar ciclo e excluir ciclo).
- **`RegisterStudyModal.tsx`** — `{ subject, defaultNetSeconds, onSubmit(payload): Promise, onCancel }`.
  Formulário de **registro do estudo** aberto ao clicar em Finalizar. Campos: tempo líquido em H:M
  (pré-preenchido por `defaultNetSeconds`, editável), data (default hoje), período (auto-detectado pelo
  horário local via `detectPeriod()`, editável), método (obrigatório) e opcionais questões/acertos/páginas
  + descrição (placeholder "Parei na página..."). Exporta o tipo `RegisterStudyPayload`. Gerencia
  `saving`/`error` locais; `onSubmit` **deve lançar** em erro (o modal exibe e permanece aberto).

## 5. Páginas & fluxos

- **`/login`, `/register`** (`(auth)`): forms controlados, `api.post("/auth/login"|"/auth/register")`
  → `router.push("/dashboard")`; erro em banner vermelho.
- **`/dashboard`**: `api.get<DashboardSummary>("/dashboard/summary")`. 5 `StatCard` (hoje/semana/mês/
  total/streak) via `formatDuration(*Seconds)`, barras por matéria (largura relativa a `seconds`,
  `backgroundColor` = cor da matéria) e última sessão (`formatDuration(accumulatedSeconds)`). Estado
  vazio de "Tempo por matéria" linka para **`/study`**.
- **`/cycles`**: `api.get<{cycles: CycleSummary[]}>("/study-cycles")`. Cards com badge "ativo",
  contagem de matérias; ações Editar (→ `/cycles/[id]`), Ativar (`PATCH /:id/activate`), Excluir
  (`del`, via `ConfirmModal` tone="danger"). `NewCycleModal` cria (`POST /study-cycles`) e navega para o editor.
- **`/cycles/[id]`** — **editor staged** (centro do padrão): carrega o ciclo para um **array local
  `EditItem[]`**; **todas as edições são locais até Salvar**. `key` de cada item vem de um contador
  `useRef` (`nextKey`); `existing:true` marca itens vindos do servidor.
  - **Drag-and-drop** com `@dnd-kit` (`DndContext`+`PointerSensor`+`closestCenter`, `SortableContext`
    `verticalListSortingStrategy`, `arrayMove`). A **ordem do array = `position`**.
  - **Peso e nível sempre editáveis** (inclusive em itens já salvos; `<select>` staged, contabiliza só
    no Salvar). `plannedMinutes` sempre editável (5–600). **Cor sempre editável** via `ColorPicker`
    (swatch clicável → popover com a paleta `COLORS`); a cor vai no `PUT` e o backend atualiza a
    `Subject` (global). O **nome** da matéria permanece read-only após adicionada (renomear criaria
    matéria nova, órfã do histórico — fora do escopo).
  - **Auto-organizar**: ordena por `priorityOf = weight*(6-knowledgeLevel)` desc e sugere
    `plannedMinutes = min(120, max(15, priority*5))` (transformação **no cliente**, staged).
  - **Validação antes de salvar** (`validate()`): nome ≥ 2 chars, ≥ 1 matéria, sem nomes duplicados
    (case-insensitive) nem vazios; erro em banner sem chamar a API.
  - **Salvar**: `api.put("/study-cycles/:id", { name, items })` (ordem = posição) → `/cycles`.
- **`/study`** — tela estilo **GranCursos**. Estado: `cycle: ActiveCycle`, `session`, `recent`,
  `busy`, `registerOpen`, `menuOpen`, `confirmRestartCycle`, `restartTarget`, `selectedSubjectId` +
  o modo foco via `useFocusMode()`. `load()` faz `Promise.all` de `/study-cycles/active`,
  `/study-sessions/active`, `/study-sessions?page=1&pageSize=15` e sincroniza o **modo foco** com a
  existência de sessão (`setFocus(Boolean(session))`; um cleanup no unmount garante `setFocus(false)`).
  - **`FocusPanel` (3 estados)**: (1) **sem sessão e sem seleção** → o anel mostra o total do ciclo
    (`formatClock(totalStudiedSeconds)` / `totalPlannedSeconds`), sem matéria pré-selecionada; (2)
    **matéria selecionada** (via lista) → mostra a matéria + botão **"Iniciar Sessão"** (só então
    começa a contar); (3) **sessão ativa** → cronômetro da sessão + Pausar/Retomar, **Reiniciar timer**
    (`RotateCcw` → `PATCH /study-sessions/:id/reset`, zera e **pausa**) e Finalizar.
  - **Selecionar ≠ iniciar**: o ▶ de cada item da lista agora **seleciona** (`setSelectedSubjectId`,
    borda accent na linha), não inicia; iniciar é só pelo "Iniciar Sessão" do painel.
  - **Modo foco**: iniciar a sessão liga o foco (colapsa sidebar + esconde a lista de disciplinas); um
    botão **"Mostrar/Ocultar menu"** (`Eye`/`EyeOff`) alterna `revealed`; sai do foco ao Finalizar.
  - Coluna esquerda: card do **ciclo atual** com `CycleDonut` (segmentos = itens ativos) e menu **⋮**
    com **Reiniciar ciclo** (abre `ConfirmModal` → `PATCH /study-cycles/active/restart`); abaixo, **Últimos
    Estudos** (sessões finalizadas agrupadas por dia; tempo = `formatClock(accumulatedSeconds)`).
  - Coluna direita: **Sequência de Estudo** — por item: **bolinha da cor** + nome em texto escuro (contraste),
    barra de progresso (`studiedSeconds/planned`, verde quando `concluded`), `HH:MM:SS/HH:MM:SS`,
    **📝 Registrar Estudo** (`onRegister` → `manualTarget`; lançamento manual, ver abaixo), **🔄**
    (abre `RestartSubjectModal` → `PATCH /study-cycles/active/subjects/:subjectId/restart {mode}`) e **▶**
    iniciar (só item ativo e sem sessão aberta; move o ponteiro do ciclo no backend).
  - **`TimerPanel`** (quando há sessão): usa `useSessionTimer`, botões Pausar/Retomar/Finalizar (sem
    campo de notas inline — **Finalizar** abre o `RegisterStudyModal`).
  - **Finalizar → registro**: `Finalizar` chama `openRegister` — se a sessão está `RUNNING`, **pausa
    antes** (`PATCH .../pause`, congela o cronômetro) e então seta `registerOpen`; o `RegisterStudyModal`
    coleta os dados (tempo líquido já parado) e seu `onSubmit` chama `PATCH /study-sessions/:id/finish`
    com o payload; em sucesso fecha o modal, limpa a sessão e `load()`. Em erro, a exceção sobe e o modal
    exibe a mensagem. Cancelar mantém a sessão pausada (dá pra Retomar).
  - **Registrar Estudo (manual)**: o botão 📝 do card seta `manualTarget` e abre **o mesmo**
    `RegisterStudyModal` (`defaultNetSeconds={0}`); `registerStudy` faz `POST /study-sessions/register`
    com `{subjectId, ...payload}` → fecha e `load()`. Para estudos feitos fora do app. Só um modal aberto
    por vez (`registerOpen` p/ finalizar vs `manualTarget` p/ manual).

## 6. Convenções

- **Server Component por padrão** para o `page.tsx` de rota (busca inicial via `apiServer`); marque
  `"use client"` só na **ilha interativa** (timer, formulários, botões de mutação, `(app)/layout.tsx`,
  hooks). Padrão de split: `page.tsx` (RSC) busca os dados e renderiza um `*Client.tsx` (seedado por
  props: `/study`→`StudyClient`, `/cycles/[id]`→`CycleEditorClient`) **ou** delega ações a componentes
  client pequenos (`/dashboard`→`StartNextButton`, `/cycles`→`CycleActions`/`NewCycleButton`). Componentes
  puros (`StatCard`) não têm diretiva.
- **Sem estado global / sem SWR/React Query**: o cache de navegação vem do **Router Cache do App
  Router** (telas já visitadas voltam instantâneas); após uma mutação, ou `router.refresh()` revalida o
  RSC (dashboard/cycles), ou o client component faz **recarga direcionada** (`reloadCycle`/`reloadRecent`/
  `reloadActive` via `api.get`, no `/study`). Client components que recebem dados por props **seedam** o
  `useState` a partir delas (não refazem fetch no mount).
- **Padrão staged** (ex.: `/cycles/[id]`): modelo do servidor → estado local → edições locais → um
  único `PUT` → navega. A ordem do array codifica `position`; `existing` decide campos travados.
- **Wrapper `run(action)`** (na `/study`): seta `busy`, limpa erro, `await action()`, captura erro em
  banner, `finally` libera `busy` — desabilita botões e evita duplo submit.
- **Erros na UI**: `err instanceof Error ? err.message : "<fallback>"` em banner
  `bg-red-50 text-red-600`. Loading = **`<PageLoader />`** (spinner), não texto solto.
- **Cor da matéria = bolinha, não o texto** (contraste): pinte um `rounded-full` com `backgroundColor`
  e mantenha o texto em `slate` escuro. Vale para dashboard, Sequência de Estudo e Últimos Estudos.
- **Confirmações destrutivas/importantes** usam `ConfirmModal`, não `confirm()` nativo.
- **Tailwind v4** utility-only (sem config, sem `@apply`): cards `rounded-2xl bg-white p-{5,6} shadow-sm`;
  acento `indigo-600`; neutros `slate`; `emerald` sucesso/ativo, `amber` pausado, `red` destrutivo.
  **Cor por matéria** é dinâmica → `style={{ backgroundColor/color: subject.color }}` (não classe util).
- Ícones são **emoji** (📊 ▶️ 🔄 ⋮ ▶ ⏸ ✔ ✕). `confirm()` nativo para ações destrutivas.

## 7. Decisões

- **Data fetching SSR-first**: a carga inicial de cada tela é server-side (`apiServer`, server→server com
  o cookie encaminhado) para eliminar o round-trip visível e o spinner; mutações e recargas seguem
  client-side (`api.ts`, `credentials:"include"`, cookie httpOnly — sem token em JS/localStorage). O
  proxy same-origin (`next.config.ts`) continua **essencial para o client** (cookie first-party); o
  server não precisa dele. **Timer com optimistic update**: pause/resume/reset alteram o estado local na
  hora (o tick vivo fica no `FocusPanel`, espelhado num `elapsedRef` para congelar no valor exibido) e
  reconciliam com a resposta; em erro, `reloadActive()` restaura o estado real. `startSession` usa a
  sessão devolvida pelo POST (sem o `load()` de 3 fetches; só um `reloadCycle` p/ o ponteiro).
- **`@dnd-kit`** para drag-and-drop (compatível com React 19); **Auto-organizar** é transformação no
  cliente (só persiste no Salvar).
- **Rotas separadas**: `/study` (estudar/timer, ciclo ativo) vs `/cycles` (gerência) vs `/cycles/[id]`
  (editor). Aba "Matérias" foi **removida** (matérias são geridas dentro do ciclo).
- **CORS/porta**: rodar o web em **`localhost:3000`** (origem liberada pela API). Em outra porta o
  cookie/CORS falha.

## 8. Como adicionar uma página/fluxo (siga o padrão)

1. Crie a rota em `src/app/(app)/<rota>/page.tsx` com `"use client"`.
2. Carregue dados com `api.get` (tipando pelo `lib/types.ts`; se faltar tipo, adicione lá espelhando o
   DTO do backend).
3. Mutations via `api.post/put/patch/del`; use o padrão `run(action)`/`busy` e banner de erro.
4. Se for edição complexa, use o **padrão staged** (estado local → salvar → refetch/navegar).
5. Adicione o item em `NAV_ITEMS` se for uma seção de topo.
6. **Atualize este CLAUDE.md** (páginas/componentes/tipos/decisões/changelog).

## 9. Rodar

```bash
npm run dev -w apps/web   # http://localhost:3000 (precisa da API em :3001 e do banco)
npm run typecheck -w apps/web
```

## 10. Changelog (append-only; registre cada mudança)

- **MVP** — auth (login/registro), dashboard, matérias, tela de ciclo com timer.
- **Construtor de ciclos** — remoção da aba Matérias; `/cycles` (lista) e `/cycles/[id]` (editor staged
  com `@dnd-kit`, peso/nível travados, auto-organizar, salvar via `PUT`). Renomeada a navegação para
  Dashboard/Estudar/Ciclos.
- **Tela Estudar (GranCursos) + reinícios** — `/study` reescrita: `CycleDonut`, Sequência de Estudo com
  progresso/▶/🔄 por matéria, `RestartSubjectModal` (save/discard), Reiniciar ciclo no menu ⋮, Últimos
  Estudos. Novos tipos `ActiveCycle`/`ActiveCycleItem`; `StudySession` ganhou `cycleId`/`cycleName`;
  `api.put`/`api.del` adicionados; componentes `CycleDonut`/`RestartSubjectModal`.
- **Documentação de contexto para IA** — criados os `CLAUDE.md` (raiz, `apps/api`, `apps/web`).
- **Correção de link quebrado (teste E2E)** — no Dashboard, o link do estado vazio de "Tempo por matéria"
  apontava para `/cycle` (rota inexistente → 404); corrigido para `/study`.
- **Melhorias do teste E2E** — (1) `formatMinutes` → `formatDuration` (segundos; sessões curtas não somem);
  dashboard passa a consumir `*Seconds`/`SubjectTimeSummary.seconds` e Últimos Estudos usa `accumulatedSeconds`.
  (2) `PageLoader` (spinner) substitui os "Carregando..." soltos. (3) `ConfirmModal` substitui o `confirm()`
  nativo em reiniciar ciclo e excluir ciclo. (4) Validação no editor de ciclo (nome, ≥1 matéria, sem duplicadas).
  (5) Contraste: cor da matéria vira bolinha, texto escuro. (6) Favicon `app/icon.svg` (fim do 404 de `/favicon.ico`).
- **Registro de estudo ao finalizar** — `RegisterStudyModal` (tempo líquido H:M, data, período auto-detectado,
  método, questões/acertos/páginas, descrição) aberto pelo botão Finalizar; removidos o input de notas inline e
  o estado `notes` do `TimerPanel`. `finishSession` agora envia o payload completo (não usa mais `run/busy`,
  lança em erro p/ o modal tratar). Tipos `StudyMethod`/`StudyPeriod` e novos campos em `StudySession`.
- **Auto-pausar ao finalizar** — `openRegister` pausa a sessão `RUNNING` (congela o cronômetro) antes de abrir
  o `RegisterStudyModal`, para o tempo líquido pré-preenchido refletir o valor parado.
- **Trocar cor da matéria no editor** — no `/cycles/[id]`, o swatch de cor de cada matéria vira um
  `ColorPicker` (popover com a paleta `COLORS`), editável inclusive em itens existentes. `COLORS` movida
  p/ escopo do módulo (reusada por `ColorPicker` e `AddItemForm`). Backend passou a persistir a cor.
- **Registrar estudo manual (sem cronômetro)** — botão 📝 "Registrar Estudo" em cada card da Sequência de
  Estudo reusa o `RegisterStudyModal` (`defaultNetSeconds={0}`, estado `manualTarget`) e chama
  `POST /study-sessions/register`. O modal converte a data em ISO (`dateInputToISO`): **hoje → instante
  atual** (entra na rodada atual, igual ao Finalizar); **data passada → meio-dia local** (evita pulo de
  fuso; conta no dashboard daquele dia).
- **Redesign "Deep Work" (dark-first)** — novo design system com tokens de tema em `globals.css`
  (`@theme inline` + `--sb-*`, escuro padrão / `html.light`), fontes Space Grotesk + IBM Plex Mono
  (`next/font`), ícones **lucide-react** (fim dos emoji) e **tema claro/escuro** (`ThemeToggle` +
  script anti-flash). Sidebar de 256px → **rail de 72px** (barra inferior no mobile). Telas refeitas:
  Login/Register (dark, accent lime), Dashboard (card "Hoje" invertido, "Próxima no ciclo" via
  `/study-cycles/active`, streak pill), Estudar (**centro de comando** com `ProgressRing`, barra
  empilhada + fila com ações no hover ▶/reiniciar/registrar), Ciclos (cards com barra empilhada via
  `CycleSummary.segments`), Editor (título inline, toggle custom, prioridade `P·N`). Novos componentes
  `ProgressRing`/`ThemeToggle`; `StatCard` ganhou `highlight`; **`CycleDonut` removido**. Todos os modais
  re-estilizados (surface + overlay `black/60`). Marcadores de matéria viraram **quadrados**.
- **Sidebar expansível** — o rail fixo de 72px virou uma sidebar **expandível/minimizável** (padrão
  expandida, 240px, com o nome de cada seção; minimiza para 72px só-ícones). Toggle `PanelLeftClose/Open`,
  estado persistido em `localStorage['sb-sidebar']`; `ThemeToggle` ganhou prop `expanded` (rótulo). Mobile
  segue como barra inferior.
- **Chip de perfil no rodapé (`UserMenu`)** — o rodapé passou a ser um chip (avatar + nome) que abre um
  popover com nome completo, e-mail, opção de tema e Sair (tema e logout saíram das linhas soltas).
- **Redesign "Papel" (tema claro + escuro)** — nova direção editorial (importada de um handoff de
  design via MCP `DesignSync`, só leitura) substitui "Deep Work". Re-tokenização completa dos `--sb-*`
  em `globals.css` (base papel/carvão, **accent terracota**, novo token `--sb-track`); fontes trocadas
  no `layout.tsx` raiz para **Newsreader** (serif), **Hanken Grotesk** (sans) e **Space Mono** (mono),
  com novo utilitário `font-serif` no `@theme`. `font-serif` aplicado em títulos de página e números
  grandes (`StatCard` value, `<h1>`/`<h2>` do dashboard, "Próxima no ciclo", títulos de Ciclos/Editor/
  Login/Cadastro). Ajustes por spec no **Dashboard** (streak `rounded-full`, barras em `bg-track`) e na
  **Estudar** (anel `size={290}`, timer mono 52px/700, badge "rodando" em accent sólido, botões do timer
  `rounded-[15px]`, segmentos da fila em `bg-track`) — comportamento da tela Estudar preservado.
- **Estudar: seleção deliberada + modo foco + reiniciar timer** — a `/study` deixou de pré-selecionar
  o `currentItem`: o `FocusPanel` abre mostrando o **total do ciclo** (estudado / planejado). Clicar
  numa matéria da lista agora **seleciona** (`selectedSubjectId`) e exibe **"Iniciar Sessão"** (não conta
  ainda); só o botão do painel inicia. Novo **modo foco** (Context `lib/focus-mode`, provido no
  `(app)/layout.tsx`): iniciar a sessão colapsa sidebar + esconde a lista, com botão **Mostrar/Ocultar
  menu** (`revealed`) e saída ao Finalizar. Botão **Reiniciar timer** (`RotateCcw`) na sessão ativa
  chama `PATCH /study-sessions/:id/reset` (zera e **pausa**). Editor de ciclo: **peso e nível** viraram
  editáveis também em itens já salvos (staged; nome segue read-only). Label do registro de estudo:
  "Páginas" → **"Páginas Estudadas"**.
- **Fixes de performance (waterfalls)** — (1) Novo **`src/middleware.ts`** vira a guarda de auth (checa o
  cookie no edge, só bloqueia rotas privadas sem cookie → `/login`); o `(app)/layout.tsx` deixou de
  gatear os children no `/users/me`, então os dados de cada página carregam em paralelo (fim do waterfall
  serial). (2) `lib/api.ts`: `request`/`api.get`
  aceitam `AbortSignal`; **401** fora das telas de auth redireciona global p/ `/login`. (3) Todos os
  loaders (`layout`, `study`, `dashboard`, `cycles`, `cycles/[id]`) usam `AbortController` com cleanup no
  unmount. (4) `/study`: os "Últimos estudos" pedem `pageSize=6&status=FINISHED` (era 15 sem filtro); as
  mutações `finish/register/restart` fazem **recarga direcionada** (`reloadCycle`/`reloadRecent`) em vez
  do `load()` completo de 3 fetches. (5) `FocusModeProvider` recebe `value` memoizado (`useMemo`).
- **Correção de login em produção (cookie cross-site)** — front (Vercel) e API (Render) em domínios
  distintos tornavam o cookie httpOnly de sessão um **third-party cookie bloqueado** pelo navegador
  (login dava POST 200 mas o Set-Cookie era rejeitado → não logava; pior no anônimo). Solução:
  **proxy same-origin** via `next.config.ts` `rewrites()` (`/api/*` → `API_ORIGIN`); em produção o
  client usa `NEXT_PUBLIC_API_URL=/api` (relativo), então o navegador só fala com o domínio do front e o
  cookie vira first-party. Dev segue chamando `http://localhost:3001/api` direto.
- **Performance: SSR-first + optimistic timer** — combate à lentidão percebida em produção (round-trip
  visível a cada tela/ação). (1) Nova camada **`lib/api-server.ts`** (`apiServer`) faz fetch server→server
  encaminhando o cookie; **401 → redirect `/login`**. (2) `page.tsx` de `/dashboard`, `/cycles`,
  `/cycles/[id]` e `/study` viraram **Server Components** (dados buscados no servidor, HTML pronto, fim do
  `PageLoader`-após-montar). Novos client components extraídos: `dashboard/StartNextButton`,
  `cycles/CycleActions` + `cycles/NewCycleButton` (usam `router.refresh()` p/ revalidar o RSC),
  `cycles/[id]/CycleEditorClient` e `study/StudyClient` (seedados por props). (3) `/study` ganhou
  **optimistic update** em pausar/retomar/reiniciar (UI reage antes da resposta; reconcilia depois; erro →
  `reloadActive`); o tick vivo do cronômetro segue escopado no `FocusPanel` (espelhado em `elapsedRef`
  para congelar no valor exibido). `startSession` deixou de fazer o `load()` de 3 fetches (usa a sessão do
  POST + `reloadCycle`). O cache de navegação passou a vir do **Router Cache** do App Router (sem
  SWR/React Query). Verificado: typecheck, `next build` (rotas marcadas `ƒ Dynamic`) e smoke test SSR
  (307 sem cookie / 200 com cookie e dados no HTML).
- **Robustez do SSR (fixes da revisão)** — `api-server.ts` ganhou `AbortSignal.timeout(10s)` (cold start
  do Render não pendura o server-render) e o `cycles/[id]` passou a `encodeURIComponent(id)` no path. Novo
  `app/(app)/error.tsx` (boundary com "tentar de novo") cobre falha/timeout do fetch server-side. Parte
  do lote de segurança/precisão (backend: fuso Brasília, bounds anti-overflow, rate limiting, sessão única).