export const organization = {
  name: "Teranga Business Hub",
  shortName: "TBH",
  tagline: "Finance solidaire, projets structurés, impact durable.",
  adhesionAmount: 10000,
  phone: "+221 77 908 68 27",
  email: "direction@terangabusinesshub.com",
  emails: {
    contact: "contact@terangabusinesshub.com",
    direction: "direction@terangabusinesshub.com",
    support: "support@terangabusinesshub.com",
    candidature: "candidature@terangabusinesshub.com",
    accompagnement: "accompagnement@terangabusinesshub.com",
    formation: "formation@terangabusinesshub.com",
    partenariat: "partenariat@terangabusinesshub.com",
    donnees: "donnees@terangabusinesshub.com",
    reclamation: "reclamation@terangabusinesshub.com",
  },
  legal: {
    legalName: "TERANGA BUSINESS HUB",
    tradeName: "TERANGA BUSINESS HUB",
    legalForm: "SAS",
    shareCapital: 1000000,
    country: "Sénégal",
    address: "Dakar – Sacré-Cœur, Immeuble Ecobank, 1er étage",
    rccm: "SN.DKR.2021.A.31751",
    ninea: "008888573",
    representative: "Baye Assane Fall",
    representativeRole: "PDG",
    publicationDirector: "Baye Assane Fall",
    openingHours: ["Lundi au jeudi : 08 h 00 – 14 h 00", "Vendredi : 08 h 00 – 13 h 30"],
  },
  card: {
    name: "Carte SIRA",
    expandedName: "Solution innovante pour une réussite associative",
    annualFee: 10000,
    validityMonths: 12,
    includedTrainings: 3,
  },
  socialLinks: {
    facebook: "https://www.facebook.com/Saytuko",
    instagram: "https://www.instagram.com/terangabusinesshubs",
    linkedin: "https://www.linkedin.com/in/teranga-business-hubs-27429541b",
    tiktok: "https://www.tiktok.com/@terangabusinesshubs",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "",
  },
} as const;

export const contributionPlans = [
  { amount: 5000, range: "250 000 à 500 000 FCFA", label: "Essentiel", benefits: ["Accès aux ressources de base", "Formations collectives", "Suivi des cotisations"] },
  { amount: 10000, range: "500 000 à 1 500 000 FCFA", label: "Croissance", benefits: ["Ressources avancées", "Formations et accompagnement", "Préparation du projet"] },
  { amount: 20000, range: "1 500 000 à 3 000 000 FCFA", label: "Développement", benefits: ["Accès à toutes les ressources", "Mentorat personnalisé", "Accompagnement renforcé"] },
] as const;

export const teamMembers = [
  { name: "Baye Assane Fall", role: "PDG et Directeur général", department: "Direction", photo: "/team/baye-assane-fall.jpeg" },
  { name: "Thérèse Gomis", role: "Assistante de direction", department: "Direction", photo: "/team/therese-gomis.jpeg" },
  { name: "Mamadou Thiam", role: "Responsable administratif et financier", department: "Administration et finance", photo: "/team/mamadou-thiam.jpeg" },
  { name: "Massamba Daouda Sène", role: "Responsable des opérations", department: "Opérations", photo: "/team/massamba-daouda-sene.jpeg" },
  { name: "Sokhna Khady Mbacké", role: "Conseillère commerciale", department: "Développement commercial", photo: "/team/sokhna-khady-mbacke.jpeg" },
  { name: "Oumar Ba Badji", role: "Responsable de la programmation", department: "Technique", photo: "/team/oumar-ba-badji-portrait.png" },
  { name: "Djiby Loum", role: "Développeur", department: "Technique", photo: "/team/djiby-loum-portrait.png" },
  { name: "Moustapha Ba", role: "Responsable community manager", department: "Communication", photo: "/team/moustapha-ba.jpeg" },
  { name: "Mouhamed Diop", role: "Designer senior", department: "Création", photo: "/team/mouhamed-diop.jpeg" },
] as const;

export const publicSocialLinks = Object.entries(organization.socialLinks)
  .filter((entry): entry is [string, string] => Boolean(entry[1]))
  .map(([network, href]) => ({
    network,
    href,
    label: network === "linkedin" ? "LinkedIn" : network === "tiktok" ? "TikTok" : network.charAt(0).toUpperCase() + network.slice(1),
  }));

export function formatFcfa(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
}
