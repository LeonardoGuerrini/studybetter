# CLAUDE.md — Backend (`apps/api`)

> **REGRA DE MANUTENÇÃO (obrigatória).** Este arquivo é a fonte de contexto para agentes de IA
> trabalharem no backend. **Toda nova funcionalidade, alteração de comportamento ou decisão
> arquitetural DEVE ser registrada aqui** na mesma tarefa em que for feita:
> - endpoint novo/alterado → atualizar a tabela de **Endpoints**;
> - modelo/campo/migração → atualizar **Modelo de dados**;
> - regra de negócio/fórmula → atualizar **Regras de domínio**;
> - decisão técnica → atualizar **Decisões arquiteturais**;
> - sempre acrescentar uma linha no **Changelog** ao final.
> Não deixe o documento divergir do código. Se encontrar divergência, corrija o doc.
> Ao seguir este doc, **não invente** nomes de arquivos, campos ou rotas — confira no código.

---

## 1. O que é

API REST do **Study Better** (gerenciador de estudos): autenticação, matérias, ciclos de estudo
montados manualmente, sessões de estudo com timer, progresso por rodada e dashboard.
Node.js + **Express 5** + **TypeScript (ESM, sem build — roda via `tsx`)** + **Prisma/PostgreSQL** + **Zod** + **Vitest**.

Porta padrão: **3001**. Prefixo de todas as rotas: **`/api`**. CORS: origem `WEB_ORIGIN`
(padrão `http://localhost:3000`) com `credentials: true` (cookie httpOnly).

## 2. Arquitetura — modular por domínio (Clean/Hexagonal)

Cada módulo em `src/modules/<módulo>/` tem até 4 camadas, com **dependência sempre para dentro**:

```
presentation  →  application  →  domain  ←  infrastructure
(controllers,     (casos de uso)  (entidades,    (Prisma repos,
 rotas, DTOs,                      regras puras,   bcrypt, jwt —
 schemas zod)                      contratos/ports) implementam os ports)
```

- **domain**: entidades, regras puras (funções), e **contratos de repositório** (interfaces/ports).
  Não importa nada de outras camadas (só `shared/errors`). Nunca importa Prisma.
- **application**: casos de uso. Recebem repositórios **por injeção no construtor** (dependem de
  interfaces do domain, nunca do Prisma). Orquestram o domínio.
- **infrastructure**: implementações técnicas (repositórios Prisma implementam os ports do domain,
  hasher bcrypt, serviço JWT).
- **presentation**: controllers (finos, sem regra de negócio), rotas, DTOs/mappers, schemas Zod.

**Composição / injeção de dependências**: feita **apenas** nas factories `make*Routes()` em cada
`presentation/*.routes.ts` — ali se `new`am os repositórios Prisma, montam-se os casos de uso, o
controller, e registram-se as rotas. **Não há container de DI** (decisão YAGNI).

> Exceção: o módulo **`subjects`** tem só `domain/` + `infrastructure/` (sem application/presentation).
> É um módulo de apoio consumido por `study-sessions` e `study-cycles` (o repositório é injetado neles).

## 3. Módulos

| Módulo | Responsabilidade | Arquivos-chave |
|---|---|---|
| `auth` | cadastro, login, logout, hash de senha, JWT, cookie | `application/{register,login}-use-case.ts`, `infrastructure/{bcrypt-password-hasher,jwt-token-service}.ts`, `presentation/{auth.controller,auth.routes,auth.schemas,auth-cookie}.ts`, `domain/auth-contracts.ts` |
| `users` | perfil do usuário logado | `application/{get,update}-profile-use-case.ts`, `infrastructure/prisma-user-repository.ts`, `domain/user.ts` |
| `subjects` | identidade da matéria (nome+cor); **`resolveManyByName`** resolve várias de uma vez (reaproveita/cria em lote e aplica a `color` → editar o ciclo troca a cor) | `domain/subject.ts`, `infrastructure/prisma-subject-repository.ts` |
| `study-sessions` | iniciar/pausar/retomar/finalizar sessão, **registrar estudo manual** (sessão FINISHED direta), histórico, cálculo de duração | `domain/{study-session,session-lifecycle}.ts`, `application/*-use-case.ts` (inclui `register-study-use-case.ts`), `infrastructure/prisma-study-session-repository.ts` (`createFinished`), `presentation/{...,session-mapper}.ts` |
| `study-cycles` | criar/editar/listar/ativar/excluir ciclos; avançar; reiniciar ciclo/disciplina; progresso da rodada | `domain/{study-cycle,calculate-item-priority,next-active-position,round-progress}.ts`, `application/*-use-case.ts`, `infrastructure/prisma-study-cycle-repository.ts`, `presentation/{...,cycle-mapper}.ts` |
| `dashboard` | agregações de tempo estudado + streak (sem persistência própria) | `domain/{date-ranges,calculate-streak}.ts`, `application/get-dashboard-summary-use-case.ts`, `presentation/*` |

## 4. `shared/`

- **`errors/AppError.ts`** — `AppError(message, statusCode=400, code="BAD_REQUEST", details?)` e subclasses:
  - `ValidationError` → **422** `VALIDATION_ERROR` ("Dados de entrada inválidos")
  - `UnauthorizedError` → **401** `UNAUTHORIZED` ("Não autenticado")
  - `NotFoundError` → **404** `NOT_FOUND` (`${recurso} não encontrado(a)`)
  - `ConflictError` → **409** `CONFLICT`
- **`middlewares/error-handler.ts`** — formato **padrão de erro** (sempre este envelope):
  ```json
  { "error": { "code": "STRING", "message": "STRING", "details": {} } }
  ```
  `AppError` → status/code próprios; `ZodError` → 422 com `details = fieldErrors`; qualquer outro →
  `console.error` + 500 `INTERNAL_SERVER_ERROR`.
- **`middlewares/validate-request.ts`** — `validateBody(schema)`: `safeParse(req.body)`, na falha lança
  `ValidationError(fieldErrors)`, no sucesso **substitui `req.body` pelos dados parseados/coeridos**.
- **`middlewares/ensure-authenticated.ts`** — `makeEnsureAuthenticated(tokens)`: lê o cookie, verifica o
  JWT, e seta `req.userId`. Sem token → 401; token inválido → 401 "Sessão expirada ou inválida".
- **`utils/route-param.ts`** — `routeParam(req, name)`: normaliza params do Express 5 (podem vir `string[]`).
- **`constants/auth.ts`** — `AUTH_COOKIE_NAME = "studybetter_token"`, `AUTH_TOKEN_TTL_DAYS = 7`.
- **`types/express.d.ts`** — augment global: `Request.userId?: string`.

## 5. `infrastructure/`

- **`config/env.ts`** — `dotenv/config` + `envSchema.parse` (Zod). Variáveis: `DATABASE_URL` (url),
  `DIRECT_URL` (url, **opcional** — só o Prisma CLI a consome via `schema.prisma`; o runtime usa
  `DATABASE_URL`), `JWT_SECRET` (mín. 32 chars), `PORT` (default 3001), `WEB_ORIGIN`
  (default `http://localhost:3000`), `NODE_ENV` (`development|test|production`, default development).
  **Sempre** ler config via `env`.
- **`database/prisma.ts`** — `export const prisma = new PrismaClient()` (única instância; importada só
  aqui e nos `*-repository.ts`).
- **`http/routes.ts`** — `makeApiRouter()` monta (tudo sob `/api`): `/auth` (público),
  `/users`, `/study-sessions`, `/study-cycles`, `/dashboard` (todos com `ensureAuthenticated`).
- **`app.ts`** (`makeApp`): `app.set("trust proxy", 1)` (IP real atrás do proxy do Render) → `helmet()`
  (cabeçalhos de segurança) → `cors({origin: env.WEB_ORIGIN, credentials:true})` → `express.json()` →
  `cookieParser()` → `GET /health` → `/api` → catch-all 404 → `errorHandler` (último).
- **`server.ts`**: `makeApp().listen(env.PORT)`.

## 6. Modelo de dados (Prisma — `prisma/schema.prisma`)

- **User** (`users`): `id`(cuid), `name`, `email`(unique), `passwordHash`, timestamps. Rel: subjects, sessions, cycles.
- **Subject** (`subjects`, `@@unique([userId,name])`): `id`, `userId`, `name`, `color`, timestamps.
  → **Identidade leve** (nome+cor). Peso/nível **não** ficam aqui (ficam no `CycleItem`).
- **enum SessionStatus** = `RUNNING | PAUSED | FINISHED`.
- **enum StudyMethod** = `PDF | QUESTIONS | VIDEO | PDF_QUESTIONS | REVIEW | MIND_MAP | FLASH_CARDS`.
- **enum StudyPeriod** = `MORNING | AFTERNOON | EVENING | DAWN`.
- **StudySession** (`study_sessions`): `id`, `userId`, `subjectId`, `status`(default RUNNING),
  `startedAt`, `endedAt?`, `durationMinutes?`, `accumulatedSeconds`(default 0), `lastResumedAt?`,
  `notes?`, `cycleId?` (rel `cycle` `onDelete: SetNull`), timestamps.
  **Registro do estudo** (preenchido ao finalizar; nullable p/ sessões antigas):
  `studyMethod?`, `studyPeriod?`, `studyDate?`, `questionsCount?`, `correctCount?`, `pagesStudied?`.
  Índices: `[userId,status]`, `[userId,endedAt]`, `[cycleId,status]`. **Índice único parcial**
  `study_sessions_userId_open_key` em `("userId") WHERE status IN ('RUNNING','PAUSED')` — garante no
  banco no máximo **uma sessão aberta por usuário** (não modelável no `schema.prisma`; vive só na migração).
- **StudyCycle** (`study_cycles`, `@@index([userId,isActive])`): `id`, `userId`, `name`,
  `currentPosition`(default 0), `isActive`(default true), timestamps. Rel: items, sessions, rounds.
- **CycleItem** (`cycle_items`, `@@unique([cycleId,position])`): `id`, `cycleId`, `subjectId`,
  `position`, `plannedMinutes`, `weight`, `knowledgeLevel`, `priorityScore`, `isActive`(default true),
  `roundStartedAt`(default now). Rel: cycle (Cascade), subject (Cascade).
- **enum CycleRoundKind** = `CYCLE_RESET | SUBJECT_SAVE`.
- **CycleRoundArchive** (`cycle_round_archives`, `@@index([cycleId])`): `id`, `cycleId`, `subjectId?`,
  `subjectName`, `studiedSeconds`, `kind`, `archivedAt`. Snapshot do tempo da rodada antes de reiniciar.

**Migrações** (`prisma/migrations/`): `init` → `cycle_builder` (move peso/nível/priorityScore/isActive de
`subjects` para `cycle_items`) → `study_screen_rounds` (adiciona `cycle_items.roundStartedAt`,
`study_sessions.cycleId`, tabela `cycle_round_archives`) → `study_registration` (adiciona os enums
`StudyMethod`/`StudyPeriod` e as colunas de registro do estudo em `study_sessions`, todas aditivas) →
`perf_indexes` (índices de performance) → `unique_open_session` (índice único parcial da sessão aberta;
SQL cru — `migrate deploy` aplica; um `migrate dev` local pode acusar drift, é intencional).
**Migrações novas devem ser aditivas** quando possível (evitar reset). Reset destrutivo
(`migrate reset`) exige consentimento explícito do usuário.

## 7. Endpoints (todos sob `/api`; auth = requer cookie)

| Método | Rota | Auth | Observações |
|---|---|---|---|
| GET | `/health` (sem `/api`) | não | `{status:"ok"}` |
| POST | `/auth/register` | não | 201, seta cookie |
| POST | `/auth/login` | não | 200, seta cookie |
| POST | `/auth/logout` | não | 204, limpa cookie |
| GET | `/users/me` | sim | perfil |
| PATCH | `/users/me` | sim | atualiza nome |
| POST | `/study-sessions/start` | sim | `{subjectId}` → 201; vincula ao ciclo ativo e move o ponteiro |
| POST | `/study-sessions/register` | sim | 201; cria sessão **FINISHED** do zero (estudo feito fora do app). Body = `{subjectId}` + campos do §9; `endedAt = studyDate`; vincula `cycleId` se a matéria está no ciclo ativo (não move o ponteiro) |
| GET | `/study-sessions/active` | sim | sessão aberta (restaura timer) |
| GET | `/study-sessions?page=&pageSize=&status=` | sim | histórico paginado (`status` opcional: RUNNING/PAUSED/FINISHED) |
| PATCH | `/study-sessions/:id/pause\|resume` | sim | controle do timer |
| PATCH | `/study-sessions/:id/reset` | sim | zera o cronômetro da sessão aberta e a deixa **PAUSADA** (não volta contando); sem body |
| PATCH | `/study-sessions/:id/finish` | sim | registra o estudo e finaliza; body obrigatório (ver §9); `netMinutes` **sobrescreve** o tempo cronometrado |
| GET | `/study-cycles/active` | sim | ciclo ativo + tempo estudado por item + totais |
| PATCH | `/study-cycles/active/advance` | sim | avança pulando itens inativos |
| PATCH | `/study-cycles/active/restart` | sim | reinicia o ciclo (arquiva + zera rodada + posição 0) |
| PATCH | `/study-cycles/active/subjects/:subjectId/restart` | sim | `{mode:"save"\|"discard"}` |
| GET | `/study-cycles` | sim | lista (resumos) |
| POST | `/study-cycles` | sim | `{name}` → 201 (1º ciclo nasce ativo) |
| GET | `/study-cycles/:id` | sim | ciclo + itens (editor) |
| PUT | `/study-cycles/:id` | sim | `{name, items[]}` — substitui todos os itens |
| DELETE | `/study-cycles/:id` | sim | 204 |
| PATCH | `/study-cycles/:id/activate` | sim | define como ativo (desativa os demais) |
| GET | `/dashboard/summary` | sim | totais, por matéria, última sessão, streak, `todaySessionsCount` (tempos em **segundos reais**) |

**Convenção de ordem de rotas**: registrar rotas estáticas (`/active`, `/active/...`) **antes** das
dinâmicas (`/:id`), senão `"active"` é capturado como `:id`.

## 8. Regras de domínio (fórmulas exatas)

- **Prioridade** (`calculate-item-priority.ts`): `priorityScore = weight * (6 - knowledgeLevel)` (1..25).
  `weight` e `knowledgeLevel` são inteiros 1..5 (senão `ValidationError`).
- **Ciclo do timer** (`session-lifecycle.ts`):
  - `elapsedSeconds = accumulatedSeconds + (lastResumedAt ? floor((now-lastResumedAt)/1000) : 0)`.
  - `RUNNING→PAUSED` (acumula o trecho), `PAUSED→RUNNING` (novo `lastResumedAt`),
    `RUNNING|PAUSED→FINISHED` (`durationMinutes = round(totalSegundos/60)`, `endedAt=now`).
  - `resetSession` (`RUNNING|PAUSED→PAUSED`): zera `accumulatedSeconds` e `lastResumedAt` (volta a
    00:00:00 **pausado**, sem começar a contar); mantém `startedAt`/`endedAt`. `FINISHED` → `ConflictError`.
  - Transições inválidas → `ConflictError`. Só **uma** sessão aberta por usuário (checado no start).
- **Progresso da rodada** (`round-progress.ts`): `studiedSecondsPerSubject` soma `accumulatedSeconds`
  das sessões finalizadas **daquele ciclo** (`cycleId`) cujo `endedAt >= item.roundStartedAt`.
  `isConcluded = studiedSeconds >= plannedMinutes*60`. → O tempo da rodada é **derivado das sessões**
  (fonte única de verdade), não um contador duplicado.
- **Avanço** (`next-active-position.ts`): próxima posição de item **ativo** com wrap-around; se nenhum
  ativo, mantém a posição.
- **Streak** (`calculate-streak.ts` + `date-ranges.ts`): dias consecutivos com sessão finalizada a
  partir de hoje (ou de ontem, se hoje ainda não estudou). Horário **local**; semana começa na segunda.
- **Agregação do dashboard em segundos reais**: `sumFinishedSeconds`/`sumFinishedSecondsBySubject`
  somam `accumulatedSeconds` (não `durationMinutes`, que arredonda e faz sessões < ~30s sumirem).
  `DashboardSummary.totals` usa `todaySeconds/weekSeconds/monthSeconds/totalSeconds`; `SubjectTimeSummary`
  usa `seconds`. `durationMinutes` continua salvo por sessão, mas **não** é a fonte dos agregados.

## 9. Validação & Auth

- **Validação**: Zod em `presentation/*.schemas.ts`. Body via `validateBody(schema)`; query via
  `schema.parse(req.query)` no controller. Regras notáveis: senha 8–72; email trim+lowercase;
  `color` `/^#[0-9a-fA-F]{6}$/` (default `#6366f1`); `weight`/`knowledgeLevel` int 1–5;
  `plannedMinutes` 5–600; ciclo até 50 itens; `mode` ∈ `{save,discard}`; notas ≤ 500; paginação
  `page≥1` (10), `pageSize` 1–50, `status` opcional (RUNNING/PAUSED/FINISHED).
- **Registro de estudo** (campos compartilhados `studyRecordShape`): `netMinutes` (int **1–1440**, teto de
  24h que também barra o overflow de `accumulatedSeconds = netMinutes*60` na coluna `Int`), `studyDate`
  (coerce date, **entre 2000 e now+1 dia**), `studyPeriod` (enum), `studyMethod` (enum); opcionais
  `questionsCount`/`correctCount`/`pagesStudied` (int **0–100000**) e `notes` (≤ 500). Refinamento:
  `correctCount ≤ questionsCount` quando ambos presentes. `finishSessionSchema` usa esses campos; `registerStudySchema` = os mesmos campos **+
  `subjectId`**.
- **Rate limiting**: `express-rate-limit` nas rotas `/auth/login` e `/auth/register` (10 req / 15 min por
  IP; 429 no envelope padrão) — contra brute-force/credential stuffing. Depende de `trust proxy` p/ o IP
  real no Render.
- **Hardening**: `helmet()` (cabeçalhos de segurança) global; `jwt.verify` com `algorithms:["HS256"]`
  fixado; login roda um `hash` dummy quando o e-mail não existe (evita enumeração por timing).
- **Auth**: `bcryptjs` (`SALT_ROUNDS=10`); `jsonwebtoken` (`subject: userId`, `expiresIn: "7d"`);
  cookie `studybetter_token` `{ httpOnly:true, secure/sameSite dependem do ambiente, path:"/", maxAge: 7d }`.
  **Dev** (mesmo host localhost): `sameSite:"lax"`, `secure:false`. **Produção** (`NODE_ENV=production`,
  front e API em domínios diferentes): `sameSite:"none"` + `secure:true` — obrigatório p/ o navegador enviar
  o cookie em requests cross-site com `credentials:"include"` (exige HTTPS nos dois lados). Ver `auth-cookie.ts`.
- **Ownership**: toda query filtra por `userId` (ex.: `findFirst({ where:{ id, userId } })`). Um usuário
  nunca acessa dados de outro (recurso de terceiro → 404).

## 10. Convenções

- Nome de arquivo: **kebab-case**, um caso de uso por arquivo (`*-use-case.ts`), repositórios
  `prisma-*-repository.ts`, schemas `*.schemas.ts`, rotas `*.routes.ts`, mappers `*-mapper.ts`.
- **ESM puro**, sem build (rodado por `tsx`). Mensagens de erro voltadas ao usuário em **pt-BR**.
- Controllers finos (sem regra de negócio). Regra de negócio no domain/application.
- DTOs/mappers (`session-mapper`, `cycle-mapper`) mantêm entidades de persistência fora das respostas
  e calculam campos derivados (`elapsedSeconds`, `studiedSeconds`, `concluded`, totais).
- Sem wrapper de async — controllers são arrow `async` e confiam no tratamento nativo de rejeição do
  Express 5 chegando ao `errorHandler`.

## 11. Como adicionar um caso de uso / módulo (siga o padrão)

1. **domain**: se precisar de dados novos, adicione o método ao contrato do repositório (ex.:
   `SubjectRepository`) e regras puras em funções testáveis.
2. **application**: crie `nome-do-caso-use-case.ts` recebendo os repositórios no construtor; lance
   `AppError`/subclasses para erros de negócio.
3. **infrastructure**: implemente o novo método do repositório em `prisma-*-repository.ts`.
4. **presentation**: schema Zod (se houver body), método no controller, e registre a rota na factory
   `make*Routes()` (respeitando estáticas-antes-de-`:id`). Exponha via mapper (não vaze entidade crua).
5. Módulo novo: crie a pasta com as 4 camadas e monte em `infrastructure/http/routes.ts`.
6. **Escreva testes** do domínio (Vitest) e **atualize este CLAUDE.md** (endpoints/modelo/decisões/changelog).

## 12. Rodar & testar

```bash
npm run dev:db  -w apps/api   # PostgreSQL local (embedded, porta 5432, sem Docker) — ou: docker compose up -d db
npm run dev     -w apps/api   # API em http://localhost:3001 (tsx watch)
npm run test    -w apps/api   # Vitest (domínio)
npm run typecheck -w apps/api # tsc --noEmit
npx prisma migrate dev        # (em apps/api) criar/aplicar migração
```
Testes cobrem **a camada de domínio** (5 arquivos `*.test.ts`: session-lifecycle, calculate-item-priority,
next-active-position, round-progress, calculate-streak). Use cases/controllers/repos não têm teste.

## 13. Decisões arquiteturais (e o porquê)

- **Modular por domínio + Clean layering**: alta coesão, baixo acoplamento; domínio testável sem I/O.
- **Sem container de DI** (composição manual nas factories) — YAGNI para o tamanho do projeto.
- **Auth própria com JWT em cookie httpOnly** (não Bearer/localStorage): protege contra XSS.
- **`Subject` como identidade leve**; `weight`/`knowledgeLevel`/`plannedMinutes`/`isActive` vivem no
  **`CycleItem`** → a mesma matéria pode ter peso/nível diferentes em ciclos distintos. A **cor** é da
  `Subject` (global): trocá-la ao editar o ciclo reflete em todos os lugares (dashboard, ciclos, sessões).
- **Tempo da rodada derivado das sessões** (via `roundStartedAt` + `cycleId`), não contador mutável —
  fonte única de verdade; editar o ciclo preserva o progresso das matérias mantidas.
- **Reinícios não-destrutivos**: `reiniciar ciclo` e `reiniciar disciplina` **arquivam** em
  `CycleRoundArchive` (kind CYCLE_RESET / SUBJECT_SAVE) e apenas movem `roundStartedAt`. **Sessões e
  anotações nunca são apagadas** (nem no `discard`, que só deixa de arquivar).
- **Ownership por `userId`** em toda query. **Migrações aditivas** por padrão.
- **Banco em produção no Supabase (Postgres gerenciado)**: o `datasource` do Prisma usa **duas** URLs —
  `url = DATABASE_URL` (runtime da API, apontando para o **pooler** Supavisor, porta 6543, com
  `pgbouncer=true&connection_limit=8`) e `directUrl = DIRECT_URL` (usada **só** por `prisma migrate`,
  conexão direta na porta 5432). O pooler é obrigatório porque a API abre conexões curtas e o Supabase
  limita conexões diretas; migrações precisam da conexão direta (o pgBouncer em transaction mode não
  suporta DDL/prepared statements). Em **dev local** (Postgres embutido, sem pooler) as duas apontam para
  o mesmo banco. Supabase substitui **só o banco** — a API Express continua hospedada à parte.
- **Deploy sem build (`tsx` em runtime)**: em produção a API roda `tsx src/server.ts` (não há passo de
  compilação). Por isso `tsx` e `prisma` vivem em `dependencies` (não devDependencies) — precisam existir no
  ambiente de produção. `postinstall` roda `prisma generate`; `start:prod` = `prisma migrate deploy && tsx
  src/server.ts` (usa `migrate deploy`, não `migrate dev`, que é dev-only e interativo).

## 14. Changelog (append-only; registre cada mudança)

- **MVP** — auth (JWT httpOnly), matérias com peso/nível/prioridade, geração automática de ciclo por
  prioridade, sessões com timer, dashboard, testes de domínio, Docker.
- **Construtor de ciclos manual** — ciclos passam a ser montados/editados manualmente (vários ciclos, 1
  ativo). `weight`/`knowledgeLevel` migram de `Subject` para `CycleItem`; **aba/rotas de Matérias
  removidas** (subjects vira módulo de apoio, upsert por nome). Endpoints CRUD de ciclo + `activate`;
  `advance` passa a pular itens inativos.
- **Tela Estudar (estilo GranCursos) + reinícios** — sessões ganham `cycleId`; `CycleItem.roundStartedAt`;
  tabela `CycleRoundArchive`. `GET /study-cycles/active` retorna tempo estudado por item + totais.
  Novos endpoints `active/restart` e `active/subjects/:subjectId/restart` (save/discard). Domínio
  `round-progress` + testes.
- **Documentação de contexto para IA** — criados os `CLAUDE.md` (raiz, `apps/api`, `apps/web`) com esta
  regra de manutenção.
- **Dashboard em segundos reais (teste E2E)** — `sumFinishedMinutes[BySubject]` → `sumFinishedSeconds[BySubject]`
  (soma `accumulatedSeconds`); `DashboardSummary.totals.*Seconds`; `SubjectTimeSummary.minutes` → `seconds`.
  Corrige sessões curtas somindo do dashboard. Sem migração (usa coluna já existente).
- **Registro de estudo ao finalizar** — migração `study_registration` (enums `StudyMethod`/`StudyPeriod`
  + colunas `studyMethod/studyPeriod/studyDate/questionsCount/correctCount/pagesStudied` nullable em
  `study_sessions`). `finishSessionSchema` passa a exigir `netMinutes`+data+período+método (opcionais:
  desempenho e notas); `FinishSessionUseCase` **sobrescreve** `accumulatedSeconds`/`durationMinutes` com o
  tempo líquido informado (fonte da verdade p/ dashboard e progresso do ciclo). `session-mapper` expõe os
  novos campos. Endpoint `finish` deixou de compartilhar a linha de `pause|resume`.
- **Trocar cor da matéria ao editar o ciclo** — `PrismaSubjectRepository.findOrCreateByName` passa a
  atualizar a `color` no upsert (`update: { color }`), então salvar o ciclo com uma cor nova aplica à
  `Subject` existente (reflete globalmente). Sem migração.
- **Registrar estudo manual** — `POST /study-sessions/register` (`RegisterStudyUseCase` +
  `sessions.createFinished` + `registerStudySchema`) cria uma sessão `FINISHED` do zero p/ estudos feitos
  fora do app. `endedAt = studyDate` (a data escolhida é a fonte da verdade p/ dashboard/streak/rodada);
  vincula `cycleId` se a matéria está no ciclo ativo (sem mover o ponteiro). Sem migração.
- **Suporte ao redesign (frontend Deep Work)** — duas adições aditivas (sem migração): (1)
  `countFinishedSince` no repositório de sessões → `DashboardSummary.todaySessionsCount` (subtítulo do card
  "Hoje"); (2) `CycleSummary` ganhou `totalPlannedMinutes` + `segments[{color,plannedMinutes}]` (matérias
  ativas) no `listByUser`, para a barra empilhada e o "Xh por rodada" dos cards de `/cycles`.
- **Preparo p/ produção (cross-domain)** — `auth-cookie.ts` passa a usar `sameSite:"none"`+`secure:true`
  quando `NODE_ENV=production` (front e API em domínios distintos exigem isso; em dev segue `lax`). No
  `package.json`: `tsx` e `prisma` movidos p/ `dependencies`; novo `postinstall` (`prisma generate`) e
  `start:prod` (`prisma migrate deploy && tsx src/server.ts`). Sem migração de schema.
- **Banco → Supabase** — `schema.prisma` ganha `directUrl = env("DIRECT_URL")` no datasource; `env.ts`
  adiciona `DIRECT_URL` (url, opcional). `.env`/`.env.example` documentam as duas URLs (dev local =
  mesmo banco; produção = pooler 6543 + direta 5432). `DATABASE_URL`/`DIRECT_URL` de produção passam a
  apontar para o Supabase. Sem alteração de schema/migração (só configuração de conexão).
- **Reiniciar o cronômetro da sessão** — novo `PATCH /study-sessions/:id/reset` (`ResetSessionUseCase`
  + `resetSession` no domínio) zera `accumulatedSeconds`/`lastResumedAt` e deixa a sessão aberta
  **PAUSADA** em 00:00:00 (não recomeça contando). Sem body/schema; DTO de resposta inalterado. Teste
  de domínio em `session-lifecycle.test.ts`. Sem migração.
- **Cutover do banco → Supabase** — banco de produção passou do Postgres do Render para o Supabase
  (projeto Supabase próprio — o project ref e as credenciais vivem só nas env vars do Render/Supabase,
  **nunca no repositório**). No Render (host da API): `DATABASE_URL` = transaction pooler
  (`...pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`) e `DIRECT_URL` = session
  pooler (`...pooler.supabase.com:5432/postgres`, obrigatória p/ o `migrate deploy` do boot). O schema
  foi criado no 1º boot pelo `start:prod` (as 4 migrações existentes; dados antigos eram de teste,
  descartados). Data API (PostgREST) do Supabase desabilitada no schema `public` — o app fala com o
  Postgres direto via Prisma, não usa a anon key. A API Express permanece no Render (só o banco mudou).
- **Fixes de performance (banco remoto)** — foco em reduzir round-trips por request (o pooler serializa
  e cada query paga RTT ao Supabase). Backend:
  - `SubjectRepository.findOrCreateByName` → **`resolveManyByName`** (lote): `SaveCycleUseCase` deixa de
    fazer N upserts em série (era ~1 por matéria, até 50) e resolve tudo em ~4-11 queries
    (`createMany` + `updateMany` por cor + `findMany`).
  - Dashboard: os 4 `sumFinishedSeconds` + `countFinishedSince` viraram **`getFinishedTotals`** (um
    `$queryRaw` com `SUM(...) FILTER`), 8→~3 queries por request. `sumFinishedSecondsBySubject` mantido.
  - Streak: `findFinishedSessionEndTimes` (trazia todas as sessões) → **`findFinishedDayKeys`** (dias
    distintos via `DISTINCT ... AT TIME ZONE 'America/Sao_Paulo'`). `calculateStreak(dayKeys, todayKey)`
    passou a operar sobre chaves de dia; `date-ranges` ganhou `toSaoPauloDayKey`/`prevDayKey`. **Mudança
    de comportamento:** o streak agora vira à meia-noite de Brasília (antes usava o fuso do servidor/UTC).
    `todaySeconds`/`todaySessionsCount` seguem no fuso do servidor (follow-up).
  - Rodada do ciclo: `findFinishedForCycle` + `studiedSecondsPerSubject` (agregava em memória) →
    **`sumStudiedSecondsForCycleRound`** (`$queryRaw` com join em `cycle_items`, respeita o
    `roundStartedAt` por matéria). Usada em `get-active-cycle`/`restart-cycle`/`restart-subject`.
  - Índices (migração `perf_indexes`): `study_sessions [userId, startedAt]` (cobre o `orderBy` do
    `listByUser`), `study_sessions [subjectId]` e `cycle_items [subjectId]` (FKs).
  - `GET /study-sessions` aceita `?status=FINISHED` (filtro opcional em `listByUser`).
  - `connection_limit` do `DATABASE_URL` de produção: **1 → 8** (a API é processo persistente no Render,
    não serverless; 1 estrangulava a concorrência). Só env var no Render.
- **Perf: start-session em paralelo** — `StartSessionUseCase` fazia 3 leituras independentes em série
  (`subjects.findById` → `sessions.findOpenByUser` → `cycles.findActiveByUser`), pagando ~3 RTT ao pooler
  remoto antes de validar/criar. Agora as três rodam num `Promise.all` (as validações
  `NotFoundError`/`ConflictError` e o `updatePosition`/`create` seguem depois). Sem mudança de
  comportamento; testes de domínio inalterados (30 passam).
- **Fixes de segurança/precisão (revisão)** — lote de correções da revisão de código:
  - **Precisão de fuso**: `date-ranges.ts` reescrito — `startOfDay/Week/Month` agora devolvem o instante
    UTC do início do dia/semana/mês **em `America/Sao_Paulo`** (constante `shared/constants/time.ts`
    `APP_TIME_ZONE`), coerente com o streak. Antes usavam o fuso do processo (UTC no Render), fazendo
    estudo noturno cair no dia errado. Novo teste `date-ranges.test.ts`.
  - **Bounds anti-overflow**: `study-sessions.schemas.ts` — `netMinutes` `.max(1440)`, contadores
    `.max(100000)`, `studyDate` restrito a 2000..now+1d. Evita 500 por estouro de `Int` e poluição das
    estatísticas. Novo teste `study-sessions.schemas.test.ts`.
  - **Rate limiting + helmet + trust proxy** em `app.ts`/`auth.routes.ts`; `jwt.verify` com alg fixado;
    dummy hash no login (anti-timing). Deps `express-rate-limit` + `helmet` adicionadas.
  - **Sessão aberta única**: migração `unique_open_session` (índice único parcial) + tratamento de
    `P2002` (`shared/utils/is-unique-violation.ts`) em `start-session` → 409 (fecha o TOCTOU de duas
    sessões RUNNING). Mesmo tratamento no `register` (corrida de e-mail duplicado → 409 limpo).
  - **`resolveManyByName`**: guard explícito no `save-cycle` se uma matéria não resolver (era `!`).
  - Verificado: typecheck, 39 testes, e smoke test (429 no rate limit; 422 no netMinutes absurdo; um
    201 + um 409 em starts concorrentes; headers do helmet presentes).
- **Perf: get-active-cycle em paralelo** — `GetActiveCycleUseCase` fazia `findActiveByUser` e depois
  `sumStudiedSecondsForCycleRound(cycle.id)` em **série** (2 RTT ao banco). Nova query
  `sumStudiedSecondsForActiveCycleRound(userId)` resolve o ciclo ativo dentro do próprio SQL (join em
  `study_cycles`), permitindo rodar as duas leituras em `Promise.all` (~1 RTT). Relevante enquanto API
  (Render/Ohio) e banco (Supabase/SP) estiverem distantes — cada round-trip custa ~120ms. `/dashboard` e
  `/study` (que chamam este caso de uso) ficam mais rápidos. Sem mudança de comportamento.
