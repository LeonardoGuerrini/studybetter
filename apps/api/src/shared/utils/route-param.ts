import type { Request } from "express";

/** No Express 5, params de rotas com curinga podem ser string[]; normaliza para string. */
export function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : value;
}
