import { z } from "zod";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const cycleNameSchema = z
  .string({ required_error: "Nome é obrigatório" })
  .trim()
  .min(2, "Nome deve ter no mínimo 2 caracteres")
  .max(60, "Nome deve ter no máximo 60 caracteres");

export const createCycleSchema = z.object({
  name: cycleNameSchema,
});

const saveCycleItemSchema = z.object({
  subjectName: z
    .string({ required_error: "Nome da matéria é obrigatório" })
    .trim()
    .min(2, "Nome da matéria deve ter no mínimo 2 caracteres")
    .max(50, "Nome da matéria deve ter no máximo 50 caracteres"),
  color: z
    .string()
    .regex(HEX_COLOR, "Cor deve estar no formato #RRGGBB")
    .default("#6366f1"),
  weight: z.coerce
    .number({ required_error: "Peso é obrigatório" })
    .int("Peso deve ser um número inteiro")
    .min(1, "Peso deve ser entre 1 e 5")
    .max(5, "Peso deve ser entre 1 e 5"),
  knowledgeLevel: z.coerce
    .number({ required_error: "Nível de conhecimento é obrigatório" })
    .int("Nível deve ser um número inteiro")
    .min(1, "Nível deve ser entre 1 e 5")
    .max(5, "Nível deve ser entre 1 e 5"),
  plannedMinutes: z.coerce
    .number({ required_error: "Tempo é obrigatório" })
    .int("Tempo deve ser um número inteiro de minutos")
    .min(5, "Tempo mínimo é 5 minutos")
    .max(600, "Tempo máximo é 600 minutos"),
  isActive: z.boolean().default(true),
});

export const saveCycleSchema = z.object({
  name: cycleNameSchema,
  items: z
    .array(saveCycleItemSchema)
    .max(50, "Um ciclo pode ter no máximo 50 matérias"),
});

export const restartSubjectSchema = z.object({
  mode: z.enum(["save", "discard"], {
    required_error: "Modo de reinício é obrigatório",
  }),
});
