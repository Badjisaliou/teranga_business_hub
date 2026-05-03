const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export type AuthUser = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: "admin" | "membre";
  statut: string;
};

export type LoginResponse = {
  token: string;
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

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationErrors = data && typeof data === "object" && "errors" in data ? (data.errors as Record<string, string[]>) : null;
    const firstValidationError =
      validationErrors && Object.keys(validationErrors).length > 0 ? validationErrors[Object.keys(validationErrors)[0]]?.[0] : null;
    const message = firstValidationError || (data && (data.message as string)) || "Erreur API";
    throw new Error(message);
  }

  return data as T;
}

export const authStorageKey = "teranga_auth_token";
export const authUserStorageKey = "teranga_auth_user";

export function saveAuthSession(token: string, user: AuthUser): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(authStorageKey, token);
  window.localStorage.setItem(authUserStorageKey, JSON.stringify(user));
}

export function getAuthToken(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(authStorageKey) ?? "";
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
