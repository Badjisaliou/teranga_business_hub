const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export type AuthUser = {
  id: number;
  matricule?: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone?: string | null;
  role: "admin" | "membre";
  statut: string;
};

export type LoginResponse = {
  token?: string;
  user: AuthUser;
};

export type SessionResponse = {
  user: AuthUser;
};

export type MemberNotification = {
  id: number;
  message: string;
  type: "paiement" | "retard" | "profil_incomplet" | "expiration";
  statut: "lu" | "non_lu";
  date_envoi: string | null;
  created_at: string | null;
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
      "X-TBH-Portal": "member",
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

export const authStorageKey = "teranga_auth_token";
export const authUserStorageKey = "teranga_auth_user";

export function saveAuthSession(_token: string | undefined, user: AuthUser): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(authStorageKey);
  window.localStorage.setItem(authUserStorageKey, JSON.stringify(user));
}

export function saveAuthUser(user: AuthUser): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(authUserStorageKey, JSON.stringify(user));
}

export async function refreshAuthUser(token = getAuthToken()): Promise<AuthUser> {
  const response = await apiRequest<SessionResponse>("/api/session", { method: "GET" }, token);
  saveAuthUser(response.user);
  return response.user;
}

export function getAuthToken(): string {
  if (typeof window === "undefined") {
    return "";
  }

  window.localStorage.removeItem(authStorageKey);
  return "cookie-session";
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(authUserStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(authStorageKey);
  window.localStorage.removeItem(authUserStorageKey);
}
