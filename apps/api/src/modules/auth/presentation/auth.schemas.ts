import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string({ required_error: "Nome é obrigatório" })
    .trim()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(60, "Nome deve ter no máximo 60 caracteres"),
  email: z
    .string({ required_error: "E-mail é obrigatório" })
    .trim()
    .toLowerCase()
    .email("E-mail inválido"),
  password: z
    .string({ required_error: "Senha é obrigatória" })
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .max(72, "Senha deve ter no máximo 72 caracteres"),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "E-mail é obrigatório" })
    .trim()
    .toLowerCase()
    .email("E-mail inválido"),
  password: z.string({ required_error: "Senha é obrigatória" }).min(1, "Senha é obrigatória"),
});
