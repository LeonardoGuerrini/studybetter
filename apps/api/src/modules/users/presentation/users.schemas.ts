import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string({ required_error: "Nome é obrigatório" })
    .trim()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(60, "Nome deve ter no máximo 60 caracteres"),
});
