const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export type AdminUser = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: "admin" | "membre";
  statut: string;
};

export type LoginResponse = {
  token: string;
  user: AdminUser;
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

export const adminAuthTokenKey = "teranga_admin_auth_token";
export const adminAuthUserKey = "teranga_admin_auth_user";

export function saveAdminSession(token: string, user: AdminUser): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(adminAuthTokenKey, token);
  window.localStorage.setItem(adminAuthUserKey, JSON.stringify(user));
}

export function getAdminToken(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(adminAuthTokenKey) ?? "";
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
