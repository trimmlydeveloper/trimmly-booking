/**
 * Normalizes NEXT_PUBLIC_API_URL and path so the final URL has no double slashes
 * and works with or without trailing slash in env.
 */
function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (raw == null || typeof raw !== "string") return "";
  return raw.trim().replace(/\/+$/, "");
}

/**
 * Builds the full URL for an API request. Path should not include leading slash.
 * Handles empty base URL (relative path) and avoids double slashes.
 */
export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.replace(/^\/+/, "");
  if (!base) return normalizedPath ? `/${normalizedPath}` : "";
  return normalizedPath ? `${base}/${normalizedPath}` : base;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : buildApiUrl(path);
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  let json: T;
  try {
    json = (await res.json()) as T;
  } catch {
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`) as Error & { code?: number };
      err.code = res.status;
      throw err;
    }
    throw new Error("Invalid response");
  }
  if (!res.ok) {
    const body = json as { code?: number; message?: string; data?: unknown };
    const err = new Error(body.message ?? `HTTP ${res.status}`) as Error & { code?: number; data?: unknown };
    err.code = body.code ?? res.status;
    err.data = body.data;
    throw err;
  }
  return json;
}
