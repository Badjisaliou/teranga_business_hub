"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthUser, apiRequest, clearAuthSession, getAuthToken, getAuthUser } from "@/lib/api";
import AppIcon from "@/components/ui/AppIcon";
import { organization } from "@/lib/institution";

const PUBLIC_LINKS = [
  { href: "/qui-sommes-nous", label: "Découvrir" },
  { href: "/formules", label: "Formules" },
  { href: "/carte-membre", label: "Carte SIRA" },
  { href: "/accompagnement", label: "Accompagnement" },
  { href: "/equipe", label: "Équipe" },
  { href: "/contact", label: "Contact" },
];

const MEMBER_LINKS = [
  { href: "/dashboard", label: "Accueil", icon: "home" as const },
  { href: "/cotisations", label: "Cotisations", icon: "calendar" as const },
  { href: "/cotisations/paiement", label: "Payer", icon: "wallet" as const },
  { href: "/paiements/historique", label: "Historique", icon: "history" as const },
  { href: "/carte", label: "Ma carte", icon: "card" as const },
  { href: "/notifications", label: "Messages", icon: "notification" as const },
  { href: "/profil", label: "Mon profil", icon: "profile" as const },
];

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setUser(getAuthUser()), 0);
    setMenuOpen(false);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  async function logout() {
    const token = getAuthToken();
    try {
      if (token) await apiRequest("/api/logout", { method: "POST" }, token);
    } catch {
      // La fermeture locale de la session reste prioritaire.
    } finally {
      clearAuthSession();
      setUser(null);
      setMenuOpen(false);
      router.push("/login");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[linear-gradient(135deg,rgba(15,33,63,0.96),rgba(30,63,115,0.94),rgba(36,75,132,0.94))] shadow-[0_14px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-5 sm:py-3 lg:px-6">
        <Link href={user ? "/dashboard" : "/"} className="group flex items-center gap-3">
          <div className="rounded-xl border border-white/15 bg-white/8 p-1 transition group-hover:scale-[1.03] group-hover:bg-white/12 sm:rounded-2xl sm:p-1.5">
            <Image src="/tbh-logo.png" alt={`Logo ${organization.name}`} width={48} height={48} className="h-10 w-10 rounded-lg bg-white object-contain p-1 sm:h-12 sm:w-12 sm:rounded-xl" />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--tbh-red)]">TBH</p>
            <p className="max-w-36 truncate text-sm font-semibold text-white sm:max-w-none sm:text-base">{organization.name}</p>
            <p className="hidden text-xs text-blue-100/75 xl:block">{organization.tagline}</p>
          </div>
        </Link>

        <nav className="hidden min-w-0 items-center gap-1 text-sm sm:gap-2 md:flex">
          {user ? (
            <>
              <div className="hidden text-right leading-tight text-blue-50 md:block">
                <p className="text-xs text-blue-100/75">Connecte</p>
                <p className="max-w-44 truncate font-semibold">{user.prenom} {user.nom}</p>
              </div>
              <span className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold md:inline-flex ${statusClassName(user.statut)}`}>
                <AppIcon name={statusIcon(user.statut)} className="h-4 w-4" />
                {humanizeStatus(user.statut)}
              </span>
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full border md:hidden ${statusClassName(user.statut)}`} title={`Compte ${humanizeStatus(user.statut)}`}>
                <AppIcon name={statusIcon(user.statut)} className="h-5 w-5" />
                <span className="sr-only">Compte {humanizeStatus(user.statut)}</span>
              </span>
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-2 text-blue-50 transition hover:bg-white/12 sm:px-4">
                <AppIcon name="home" className="h-5 w-5" />
                <span className="hidden sm:inline">Accueil membre</span>
              </Link>
            </>
          ) : (
            <>
              {PUBLIC_LINKS.map((link) => <Link key={link.href} href={link.href} className="hidden px-2 py-2 text-xs font-bold text-blue-50 hover:text-white xl:inline-flex">{link.label}</Link>)}
              <Link href="/login" className="rounded-full border border-white/12 bg-white/6 px-3 py-2 text-blue-50 transition hover:bg-white/12 sm:px-4">
                Connexion
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[color:var(--tbh-red)] px-3 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(239,74,92,0.28)] transition hover:-translate-y-0.5 hover:opacity-95 sm:px-4"
              >
                Inscription
              </Link>
            </>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-main-menu"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white md:hidden"
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          )}
          <span className="sr-only">{menuOpen ? "Fermer le menu" : "Ouvrir le menu"}</span>
        </button>
      </div>

      {menuOpen ? (
        <div id="mobile-main-menu" className="border-t border-white/10 px-3 pb-4 pt-3 md:hidden">
          <div className="mx-auto max-w-7xl rounded-2xl bg-white p-3 shadow-2xl">
            {user ? (
              <>
                <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-950">{user.prenom} {user.nom}</p>
                    <p className="text-xs text-slate-500">Compte {humanizeStatus(user.statut)}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClassName(user.statut)}`}>{humanizeStatus(user.statut)}</span>
                </div>
                <nav className="grid grid-cols-2 gap-2">
                  {(user.statut === "actif" ? MEMBER_LINKS : MEMBER_LINKS.slice(0, 1)).map((item) => (
                    <Link key={item.href} href={item.href} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700">
                      <AppIcon name={item.icon} className="h-5 w-5 text-[color:var(--tbh-red)]" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <button type="button" onClick={() => void logout()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-bold text-rose-700">
                  <AppIcon name="logout" className="h-5 w-5" /> Déconnexion
                </button>
              </>
            ) : (
              <nav className="grid gap-2">
                <Link href="/" className="rounded-xl px-3 py-3 font-semibold text-slate-700">Accueil</Link>
                {PUBLIC_LINKS.map((link) => <Link key={link.href} href={link.href} className="rounded-xl px-3 py-3 font-semibold text-slate-700">{link.label}</Link>)}
                <Link href="/login" className="rounded-xl border border-slate-200 px-3 py-3 font-semibold text-slate-700">Connexion</Link>
                <Link href="/register" className="rounded-xl bg-[color:var(--tbh-red)] px-3 py-3 text-center font-bold text-white">Inscription</Link>
              </nav>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function humanizeStatus(status: string) {
  const labels: Record<string, string> = {
    actif: "Actif",
    bloque: "Bloque",
  };

  return labels[status] ?? status;
}

function statusIcon(status: string) {
  if (status === "actif") return "check";
  if (status === "bloque") return "alert";
  return "history";
}

function statusClassName(status: string) {
  if (status === "actif") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "bloque") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}
