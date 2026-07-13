import { z } from "zod";

export const startSessionSchema = z.object({
  subjectId: z
    .string({ required_error: "Matéria é obrigatória" })
    .min(1, "Matéria é obrigatória"),
});

/** Campos comuns do registro de estudo (compartilhados por finalizar e registrar). */
// Limite defensivo p/ contadores: evita estouro da coluna Int (32-bit) e
// poluição das estatísticas com valores absurdos.
const COUNT_MAX = 100000;

const studyRecordShape = {
  netMinutes: z.coerce
    .number({ required_error: "Tempo de estudo é obrigatório" })
    .int("Tempo de estudo deve ser em minutos inteiros")
    .min(1, "Tempo de estudo é obrigatório")
    // 24h: um único registro de estudo não excede um dia (também barra o
    // overflow de `accumulatedSeconds = netMinutes * 60`, coluna Int 32-bit).
    .max(1440, "Tempo de estudo não pode exceder 24 horas (1440 min)"),
  studyDate: z.coerce
    .date({
      required_error: "Data do estudo é obrigatória",
      invalid_type_error: "Data do estudo inválida",
    })
    // Faixa sã: nada antes de 2000 nem mais de 1 dia no futuro (folga de fuso).
    .refine(
      (date) =>
        date.getTime() >= Date.UTC(2000, 0, 1) &&
        date.getTime() <= Date.now() + 24 * 60 * 60 * 1000,
      "Data do estudo fora do intervalo permitido",
    ),
  studyPeriod: z.enum(["MORNING", "AFTERNOON", "EVENING", "DAWN"], {
    required_error: "Período de estudo é obrigatório",
  }),
  studyMethod: z.enum(
    [
      "PDF",
      "QUESTIONS",
      "VIDEO",
      "PDF_QUESTIONS",
      "REVIEW",
      "MIND_MAP",
      "FLASH_CARDS",
    ],
    { required_error: "Método de estudo é obrigatório" },
  ),
  questionsCount: z.coerce.number().int().min(0).max(COUNT_MAX).optional(),
  correctCount: z.coerce.number().int().min(0).max(COUNT_MAX).optional(),
  pagesStudied: z.coerce.number().int().min(0).max(COUNT_MAX).optional(),
  notes: z
    .string()
    .trim()
    .max(500, "Anotações devem ter no máximo 500 caracteres")
    .optional(),
} as const;

/** Acertos não podem exceder as questões feitas (quando ambos informados). */
const correctWithinQuestions = (data: {
  questionsCount?: number;
  correctCount?: number;
}) =>
  data.correctCount === undefined ||
  data.questionsCount === undefined ||
  data.correctCount <= data.questionsCount;

const correctRefinement = {
  message: "Acertos não podem exceder as questões feitas",
  path: ["correctCount"] as (string | number)[],
};

export const finishSessionSchema = z
  .object(studyRecordShape)
  .refine(correctWithinQuestions, correctRefinement);

export const registerStudySchema = z
  .object({
    subjectId: z
      .string({ required_error: "Matéria é obrigatória" })
      .min(1, "Matéria é obrigatória"),
    ...studyRecordShape,
  })
  .refine(correctWithinQuestions, correctRefinement);

export const listSessionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(["RUNNING", "PAUSED", "FINISHED"]).optional(),
});
