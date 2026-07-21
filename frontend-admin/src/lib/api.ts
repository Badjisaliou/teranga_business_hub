const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export type AdminUser = {
  id: number;
  nom: string;
  prenom: string;
  email: string | null;
  role: "admin" | "membre";
  statut: string;
};

export type LoginResponse = {
  token?: string;
  user: AdminUser;
};

export type SessionResponse = {
  user: AdminUser;
};

export type ApiErrorPayload = {
  message?: string;
  error_code?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  status: number;
  errorCode: string | null;
  errors: Record<string, string[]> | null;

  constructor(message: string, status: number, errorCode: string | null = null, errors: Record<string, string[]> | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.errors = errors;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  void token; // Compatibilite temporaire des appels existants; l'authentification utilise le cookie HttpOnly.
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      "X-TBH-Portal": "admin",
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({})) as ApiErrorPayload;

  if (!response.ok) {
    const validationErrors = data && typeof data === "object" && "errors" in data ? data.errors ?? null : null;
    const firstValidationError =
      validationErrors && Object.keys(validationErrors).length > 0 ? validationErrors[Object.keys(validationErrors)[0]]?.[0] : null;
    const message = firstValidationError || data.message || "Erreur API";
    const errorCode = data.error_code ?? defaultErrorCode(response.status);
    throw new ApiError(message, response.status, errorCode, validationErrors);
  }

  return data as T;
}

function defaultErrorCode(status: number): string {
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 422) return "validation_error";
  return "http_error";
}

export const adminAuthTokenKey = "teranga_admin_auth_token";
export const adminAuthUserKey = "teranga_admin_auth_user";

export function saveAdminSession(_token: string | undefined, user: AdminUser): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(adminAuthTokenKey);
  window.localStorage.setItem(adminAuthUserKey, JSON.stringify(user));
}

export function saveAdminUser(user: AdminUser): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(adminAuthUserKey, JSON.stringify(user));
}

export async function refreshAdminUser(token = getAdminToken()): Promise<AdminUser> {
  const response = await apiRequest<SessionResponse>("/api/session", { method: "GET" }, token);
  saveAdminUser(response.user);
  return response.user;
}

export function getAdminToken(): string {
  if (typeof window === "undefined") {
    return "";
  }

  window.localStorage.removeItem(adminAuthTokenKey);
  return "cookie-session";
}

export function getAdminUser(): AdminUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(adminAuthUserKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(adminAuthTokenKey);
  window.localStorage.removeItem(adminAuthUserKey);
}
