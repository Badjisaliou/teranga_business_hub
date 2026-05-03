import type { Metadata } from "next";
import "./globals.css";
import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import AdminShell from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "Teranga Business Hub Admin",
  description: "Application admin de Teranga Business Hub",
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
