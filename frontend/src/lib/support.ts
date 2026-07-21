const defaultSupportWhatsAppNumber = "+221 77 908 68 27";

export const supportWhatsAppNumber =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim() || defaultSupportWhatsAppNumber;

export const defaultSupportWhatsAppMessage =
  "Bonjour Teranga Business Hub, j’ai besoin d’aide. Pouvez-vous m’accompagner, s’il vous plaît ?";

export function getSupportWhatsAppUrl(message = defaultSupportWhatsAppMessage) {
  if (!supportWhatsAppNumber) {
    return null;
  }

  const normalizedNumber = supportWhatsAppNumber.replace(/[^\d]/g, "");
  if (!normalizedNumber) {
    return null;
  }

  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
}

export function getSupportHelpHref(message?: string) {
  return getSupportWhatsAppUrl(message) ?? "/support";
}

export function isSupportWhatsAppConfigured() {
  return getSupportWhatsAppUrl() !== null;
}
