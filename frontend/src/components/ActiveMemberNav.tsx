"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest, clearAuthSession, getAuthToken } from "@/lib/api";

const LINKS: Array<{ href: string; label: string }> = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/paiements/historique", label: "Historique paiements" },
  { href: "/cotisations", label: "Cotisations" },
  { href: "/cotisations/paiement", label: "Paiement cotisation" },
  { href: "/carte", label: "Carte membre" },
  { href: "/profil", label: "Mon profil" },
];

export default function ActiveMemberNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const token = getAuthToken();
    try {
      if (token) {
        await apiRequest("/api/logout", { method: "POST" }, token);
      }
    } catch {
      // No-op: local session cleanup below is authoritative for frontend state.
    } finally {
      clearAuthSession();
      router.push("/login");
    }
  }

  return (
    <nav className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        {LINKS.map((link) => {
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                active ? "bg-cyan-500 text-slate-950" : "border border-slate-300 text-slate-700"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => void logout()}
          className="ml-auto rounded-md border border-rose-700 px-3 py-2 text-sm font-semibold text-rose-300"
        >
          Déconnexion
        </button>
      </div>
    </nav>
  );
}
