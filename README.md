# Study Better

Gerenciador de estudos: cadastre matérias com peso e nível de conhecimento, gere um ciclo de estudos priorizado automaticamente, estude com timer (iniciar/pausar/retomar/finalizar) e acompanhe sua evolução no dashboard.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 + React 19 + TailwindCSS 4 (`apps/web`) |
| Backend | Node.js + Express 5 + TypeScript (`apps/api`) |
| Banco | PostgreSQL + Prisma |
| Auth | JWT em cookie httpOnly (bcrypt + jsonwebtoken) |
| Validação | Zod |
| Testes | Vitest |

## Arquitetura

Monorepo (npm workspaces) com backend em **arquitetura modular por domínio**. Cada módulo em `apps/api/src/modules/` tem quatro camadas:

- `domain/` — regras puras de negócio (entidades, cálculo de prioridade, máquina de estados da sessão, geração do ciclo, contratos de repositório). Sem dependência de framework ou banco.
- `application/` — casos de uso que orquestram o domínio via contratos (injeção por construtor).
- `infrastructure/` — implementações técnicas (repositórios Prisma, bcrypt, JWT).
- `presentation/` — controllers, rotas, schemas Zod (DTOs) e mappers de resposta.

Módulos: `auth`, `users`, `subjects`, `study-sessions`, `study-cycles`, `dashboard`. Código transversal em `shared/` (erros, middlewares, constantes) e composição/bootstrap em `infrastructure/` (config, database, http).

## Regras de negócio principais

- **Ciclos (construtor manual)**: o usuário cria vários ciclos e monta cada um adicionando matérias (nome, cor, **peso**, **nível de conhecimento** e **tempo**) direto no ciclo. Cada matéria vira um item do ciclo — a mesma matéria pode ter peso/nível diferentes em ciclos distintos. Na edição é possível remover/adicionar matéria, trocar o tempo, **reordenar por drag-and-drop** e ativar/desativar itens; **peso e nível ficam fixos** após criados. As mudanças só valem ao clicar em **Salvar** (o `PUT` substitui os itens do ciclo em transação). **Um ciclo ativo** por vez alimenta o fluxo de estudo.
- **Prioridade**: `priorityScore = weight × (6 − knowledgeLevel)` (1..25), calculada por item ao salvar. O botão **Auto-organizar** ordena os itens por prioridade e sugere tempos (transformação no cliente, confirmada só no Salvar).
- **Sessão**: RUNNING → PAUSED → RUNNING → FINISHED. O tempo é acumulado por trechos (`accumulatedSeconds` + `lastResumedAt`), então o timer sobrevive a reloads. Uma sessão aberta por vez. O avanço do ciclo (`advance`) **pula itens inativos**.
- **Dashboard**: calculado on-the-fly a partir das sessões finalizadas (hoje/semana/mês/total, por matéria, última sessão e streak de dias).
- **Matéria** (`Subject`) é uma identidade leve (nome + cor) reaproveitada por nome, estável para agregação do dashboard; os campos ajustáveis vivem no item do ciclo.
- Todo acesso é filtrado pelo usuário autenticado (ownership).

## Como rodar (desenvolvimento)

Pré-requisitos: Node.js 20+ e (opcional) Docker.

```bash
npm install
cp apps/api/.env.example apps/api/.env   # ajuste JWT_SECRET
```

**1. Banco de dados** — escolha uma opção:

```bash
# Com Docker
docker compose up -d db

# Sem Docker (PostgreSQL embutido; deixe o terminal aberto)
npm run dev:db
```

**2. Migrations:**

```bash
npx -w apps/api prisma migrate dev
```

**3. API e frontend (terminais separados):**

```bash
npm run dev:api   # http://localhost:3001
npm run dev:web   # http://localhost:3000
```

## Testes

```bash
npm test          # unitários de domínio (prioridade, ciclo, sessão, streak)
npm run typecheck
```

## Docker (build completo)

```bash
docker compose --profile full up --build
# web: http://localhost:3000 | api: http://localhost:3001
```

## Endpoints

Base: `http://localhost:3001/api` — todos autenticados via cookie, exceto register/login.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Cria conta e autentica |
| POST | `/auth/login` | Login (seta cookie httpOnly) |
| POST | `/auth/logout` | Logout |
| GET / PATCH | `/users/me` | Perfil do usuário |
| GET / POST | `/study-cycles` | Listar ciclos / criar ciclo `{name}` |
| GET | `/study-cycles/:id` | Ciclo + itens (para o editor) |
| PUT | `/study-cycles/:id` | Salvar ciclo `{name, items[]}` (substitui os itens) |
| DELETE | `/study-cycles/:id` | Excluir ciclo |
| PATCH | `/study-cycles/:id/activate` | Definir como ciclo ativo |
| GET | `/study-cycles/active` | Ciclo ativo + item atual |
| PATCH | `/study-cycles/active/advance` | Avançar (pula itens inativos) |
| POST | `/study-sessions/start` | Iniciar sessão `{subjectId}` |
| GET | `/study-sessions/active` | Sessão aberta (restaura o timer) |
| PATCH | `/study-sessions/:id/pause` \| `/resume` \| `/finish` | Controle do timer |
| GET | `/study-sessions?page=` | Histórico paginado |
| GET | `/dashboard/summary` | Totais, por matéria, última sessão, streak |

Erros seguem o formato `{ "error": { "code", "message", "details?" } }`.
