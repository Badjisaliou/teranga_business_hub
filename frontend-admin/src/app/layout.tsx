import type { Metadata } from "next";
import "./globals.css";
import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import AdminShell from "@/components/AdminShell";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_ADMIN_SITE_URL ?? "https://teranga-business-hub-admin.vercel.app"),
  title: {
    default: "Admin Teranga Business Hub",
    template: "%s | Admin Teranga Business Hub",
  },
  description:
    "Portail admin Teranga Business Hub pour superviser les membres, paiements, relances, exports et parametres metier.",
  applicationName: "Admin Teranga Business Hub",
  authors: [{ name: "Teranga Business Hub" }],
  creator: "Teranga Business Hub",
  publisher: "Teranga Business Hub",
  icons: {
    icon: "/tbh-logo.png",
    shortcut: "/tbh-logo.png",
    apple: "/tbh-logo.png",
  },
  openGraph: {
    type: "website",
    locale: "fr_SN",
    siteName: "Admin Teranga Business Hub",
    title: "Admin Teranga Business Hub",
    description:
      "Portail prive de supervision des membres, paiements, relances, exports et parametres metier Teranga Business Hub.",
    images: [
      {
        url: "/tbh-logo.png",
        width: 1200,
        height: 1200,
        alt: "Logo Teranga Business Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Admin Teranga Business Hub",
    description: "Portail prive de supervision Teranga Business Hub.",
    images: ["/tbh-logo.png"],
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppHeader />
        <main className="flex-1">
          <AdminShell>{children}</AdminShell>
        </main>
        <AppFooter />
      </body>
    </html>
  );
}
