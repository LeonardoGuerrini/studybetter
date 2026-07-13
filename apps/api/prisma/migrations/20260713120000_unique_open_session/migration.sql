-- Garante no banco que cada usuário tenha no máximo UMA sessão aberta
-- (RUNNING ou PAUSED) por vez, fechando a corrida (TOCTOU) do start-session em
-- que dois requests simultâneos criariam duas sessões em andamento.
--
-- Índice parcial: o Prisma não o modela no schema.prisma. Em produção é aplicado
-- por `prisma migrate deploy` (que só executa o SQL, sem detecção de drift). Um
-- eventual `prisma migrate dev` local pode sinalizá-lo como drift — é intencional,
-- não remover. IF NOT EXISTS torna a migração idempotente/segura de reaplicar.
CREATE UNIQUE INDEX IF NOT EXISTS "study_sessions_userId_open_key"
  ON "study_sessions" ("userId")
  WHERE status IN ('RUNNING', 'PAUSED');
