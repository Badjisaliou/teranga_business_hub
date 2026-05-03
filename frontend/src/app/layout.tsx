import type { Metadata } from "next";
import "./globals.css";
import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import UserShell from "@/components/UserShell";

export const metadata: Metadata = {
  title: "Teranga Business Hub",
  description: "Frontend Next.js de Teranga Business Hub",
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
