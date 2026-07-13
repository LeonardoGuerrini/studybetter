const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers:
      body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // Sessão expirada/inválida fora das telas de auth → volta pro login.
    // (O middleware barra quem não tem cookie; isto cobre token inválido/expirado.)
    if (response.status === 401 && typeof window !== "undefined") {
      const { pathname } = window.location;
      const onAuthPage =
        pathname.startsWith("/login") || pathname.startsWith("/register");
      if (!onAuthPage) window.location.replace("/login");
    }
    throw new ApiError(
      response.status,
      data?.error?.message ?? "Erro inesperado. Tente novamente.",
    );
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) =>
    request<T>(path, "GET", undefined, signal),
  post: <T>(path: string, body?: unknown) => request<T>(path, "POST", body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>(path, "PUT", body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>(path, "PATCH", body),
  del: <T>(path: string) => request<T>(path, "DELETE"),
};
