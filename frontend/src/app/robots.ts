import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://terangabusinesshub.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account-blocked",
        "/admin",
        "/carte",
        "/carte-membre",
        "/cotisations",
        "/dashboard",
        "/forgot-password",
        "/login",
        "/notifications",
        "/paiement",
        "/paiements",
        "/pending-validation",
        "/profil",
        "/register",
        "/registration-rejected",
        "/reset-password",
        "/reset-pin",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
