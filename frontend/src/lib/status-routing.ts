export type UserStatut = "actif" | "bloque";

export function routeForStatut(statut: string): string {
  switch (statut as UserStatut) {
    case "actif":
      return "/dashboard";
    case "bloque":
      return "/account-blocked";
    default:
      return "/login";
  }
}

export function routeForSessionError(errorCode: string | null | undefined): string {
  switch (errorCode) {
    case "account_blocked":
      return "/account-blocked";
    case "token_expired":
    case "token_invalid":
    case "token_missing":
    case "session_expired":
    case "unauthenticated":
    case "forbidden":
    default:
      return "/login";
  }
}
