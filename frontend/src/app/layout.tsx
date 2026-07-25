import type { Metadata } from "next";
import "./globals.css";
import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import UserShell from "@/components/UserShell";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://terangabusinesshub.com"),
  title: {
    default: "Teranga Business Hub",
    template: "%s | Teranga Business Hub",
  },
  description:
    "Teranga Business Hub accompagne les entrepreneurs dans la structuration de leurs projets et le financement solidaire sous conditions.",
  applicationName: "Teranga Business Hub",
  keywords: ["Teranga Business Hub", "entrepreneuriat", "cotisations", "accompagnement", "financement solidaire", "Sénégal"],
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
    url: "/",
    locale: "fr_SN",
    siteName: "Teranga Business Hub",
    title: "Teranga Business Hub",
    description:
      "Espace membre pour suivre adhesions, cotisations, paiements DexPay, notifications et carte membre numerique.",
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
    title: "Teranga Business Hub",
    description:
      "Espace membre pour suivre adhesions, cotisations, paiements DexPay, notifications et carte membre numerique.",
    images: ["/tbh-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
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
        <main className="tbh-page-enter flex-1">
          <UserShell>{children}</UserShell>
        </main>
        <AppFooter />
      </body>
    </html>
  );
}
