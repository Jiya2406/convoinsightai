import type { PageMeta } from "@/types/api";

/**
 * Thin typed fetch wrapper for the browser. Understands our API envelopes
 * ({ data } / { data, meta } / { error }) and throws a typed ApiClientError
 * so React Query + toasts can surface friendly messages.
 */
export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

const BASE = "/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const err = body?.error ?? {};
    throw new ApiClientError(
      res.status,
      err.code ?? "UNKNOWN",
      err.message ?? "Request failed",
      err.details,
    );
  }

  return body as T;
}

/** GET returning a single { data } envelope. */
export async function getData<T>(path: string): Promise<T> {
  const body = await request<{ data: T }>(path);
  return body.data;
}

/** GET returning a paginated { data, meta } envelope. */
export async function getPage<T>(path: string): Promise<{ data: T[]; meta: PageMeta }> {
  return request<{ data: T[]; meta: PageMeta }>(path);
}

export async function postData<T>(path: string, payload: unknown): Promise<T> {
  const body = await request<{ data: T }>(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return body.data;
}

export async function patchData<T>(path: string, payload: unknown): Promise<T> {
  const body = await request<{ data: T }>(path, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return body.data;
}

export async function deleteData(path: string): Promise<void> {
  await request<void>(path, { method: "DELETE" });
}

/** Build a query string from a params object, skipping empty values. */
export function qs(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
