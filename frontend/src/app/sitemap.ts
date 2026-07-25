import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://terangabusinesshub.com";

const publicRoutes = [
  "",
  "/accompagnement",
  "/candidature",
  "/comment-ca-marche",
  "/conditions-utilisation",
  "/contact",
  "/equipe",
  "/faq",
  "/formations",
  "/formules",
  "/gouvernance",
  "/mentions-legales",
  "/politique-confidentialite",
  "/qui-sommes-nous",
  "/reglement-programme",
  "/support",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
