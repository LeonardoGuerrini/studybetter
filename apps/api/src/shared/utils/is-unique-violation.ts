/**
 * Detecta a violação de constraint única do Prisma (código `P2002`) sem acoplar
 * as camadas de aplicação ao `@prisma/client` — apenas inspeciona o `code`.
 * Usado para transformar corridas (email duplicado, sessão aberta simultânea)
 * em `ConflictError` limpo, em vez de vazar um 500.
 */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
