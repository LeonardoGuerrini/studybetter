/**
 * Sobe um PostgreSQL local (embedded) para desenvolvimento sem Docker.
 * Uso: npm run dev:db  (mantenha o processo aberto em um terminal)
 */
import EmbeddedPostgres from "embedded-postgres";
import { existsSync, rmSync } from "node:fs";
import { connect } from "node:net";
import path from "node:path";

const PORT = 5432;
const dataDir = path.resolve(import.meta.dirname, "..", ".pgdata");

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "studybetter",
  password: "studybetter",
  port: PORT,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(1500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function main() {
  if (await isPortInUse(PORT)) {
    console.log(
      `[dev-db] Já existe um PostgreSQL rodando na porta ${PORT} — reutilizando. Nada a fazer.`,
    );
    return;
  }

  const lockFile = path.join(dataDir, "postmaster.pid");
  if (existsSync(lockFile)) {
    console.log(
      "[dev-db] Removendo lock órfão de uma execução anterior (postmaster.pid)...",
    );
    rmSync(lockFile);
  }

  if (!existsSync(path.join(dataDir, "PG_VERSION"))) {
    console.log("[dev-db] Inicializando cluster PostgreSQL embutido (UTF8)...");
    await pg.initialise();
  }

  await pg.start();

  const client = pg.getPgClient();
  await client.connect();
  const { rowCount } = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = 'studybetter'",
  );
  if (rowCount === 0) {
    await pg.createDatabase("studybetter");
  }
  await client.end();

  console.log(
    "[dev-db] PostgreSQL pronto em postgresql://studybetter:studybetter@localhost:5432/studybetter",
  );
  console.log("[dev-db] Pressione Ctrl+C para encerrar.");

  const shutdown = async () => {
    console.log("\n[dev-db] Encerrando PostgreSQL...");
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch(async (error) => {
  const message =
    error instanceof Error ? error.message : JSON.stringify(error);
  console.error(`[dev-db] Erro ao subir o banco: ${message}`);
  await pg.stop().catch(() => {});
  process.exit(1);
});
