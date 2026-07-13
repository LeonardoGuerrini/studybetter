import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  // Só o Prisma CLI (migrate) consome DIRECT_URL, lido direto do .env pelo
  // schema.prisma. O runtime da API usa DATABASE_URL. Opcional aqui: em dev
  // local pode ficar ausente (Prisma cai no DATABASE_URL para tudo).
  DIRECT_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter no mínimo 32 caracteres"),
  PORT: z.coerce.number().int().positive().default(3001),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const env = envSchema.parse(process.env);
