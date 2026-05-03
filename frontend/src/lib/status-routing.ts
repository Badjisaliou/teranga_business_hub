export type UserStatut = "en_attente" | "attente_adhesion" | "actif" | "bloque" | "rejete";

export function routeForStatut(statut: string): string {
  switch (statut as UserStatut) {
    case "actif":
      return "/dashboard";
    case "attente_adhesion":
      return "/paiement";
    case "en_attente":
      return "/pending-validation";
    case "bloque":
      return "/account-blocked";
    case "rejete":
      return "/registration-rejected";
    default:
      return "/login";
  }
}
