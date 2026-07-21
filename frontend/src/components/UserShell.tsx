"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest, clearAuthSession, getAuthToken } from "@/lib/api";
import AppIcon, { AppIconName } from "@/components/ui/AppIcon";
import { getSupportHelpHref, isSupportWhatsAppConfigured } from "@/lib/support";

const NAV_ITEMS: Array<{ href: string; label: string; icon: AppIconName }> = [
  { href: "/dashboard", label: "Accueil", icon: "home" },
  { href: "/paiements/historique", label: "Paiements", icon: "history" },
  { href: "/cotisations", label: "Cotisations", icon: "calendar" },
  { href: "/cotisations/paiement", label: "Payer", icon: "wallet" },
  { href: "/notifications", label: "Messages", icon: "notification" },
  { href: "/carte", label: "Ma carte", icon: "card" },
  { href: "/profil", label: "Profil", icon: "profile" },
];

const SHELL_PATHS = ["/dashboard", "/paiements", "/cotisations", "/notifications", "/carte", "/profil"];

export default function UserShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const shouldShowShell = SHELL_PATHS.some((path) => pathname.startsWith(path));
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!shouldShowShell) {
      return;
    }

    async function loadUnreadCount() {
      const token = getAuthToken();
      if (!token) {
        setUnreadCount(0);
        return;
      }

      try {
        const response = await apiRequest<{ meta: { unread_count: number } }>("/api/notifications", { method: "GET" }, token);
        setUnreadCount(response.meta.unread_count);
      } catch {
        setUnreadCount(0);
      }
    }

    void loadUnreadCount();
  }, [pathname, shouldShowShell]);

  async function logout() {
    const token = getAuthToken();
    try {
      if (token) {
        await apiRequest("/api/logout", { method: "POST" }, token);
      }
    } catch {
      // Local cleanup remains the source of truth for frontend session state.
    } finally {
      clearAuthSession();
      router.push("/login");
    }
  }

  if (!shouldShowShell) {
    return <>{children}</>;
  }

  const helpHref = getSupportHelpHref();
  const helpIsWhatsApp = isSupportWhatsAppConfigured();

  return (
    <div className="mx-auto w-full max-w-7xl px-3 pb-6 pt-3 sm:px-5 lg:px-6">
      <div className="hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const showUnreadBadge = item.href === "/notifications" && unreadCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md border px-3 py-2 text-sm ${
                active
                  ? "border-[color:var(--tbh-red)] bg-[color:var(--tbh-red)] text-white"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <AppIcon name={item.icon} className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
              {showUnreadBadge ? (
                <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${active ? "bg-white/20 text-white" : "bg-[color:var(--tbh-red)] text-white"}`}>
                  {unreadCount}
                </span>
              ) : null}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => void logout()}
          className="ml-auto rounded-md border border-rose-700 px-3 py-2 text-sm font-semibold text-rose-200"
        >
          <AppIcon name="logout" className="h-5 w-5" />
          <span className="sr-only">Déconnexion</span>
        </button>
      </div>

      <div className="mb-4 hidden rounded-2xl border border-blue-900/15 bg-white/90 p-3 shadow-sm md:block lg:hidden">
        <p className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--tbh-navy)]">Espace membre tablette</p>
        <nav className="grid grid-cols-4 gap-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const showUnreadBadge = item.href === "/notifications" && unreadCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center text-xs font-bold ${
                  active
                    ? "border-[color:var(--tbh-red)] bg-[color:var(--tbh-red)] text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                }`}
              >
                <AppIcon name={item.icon} className="h-6 w-6" />
                <span className="leading-tight">{item.label}</span>
                {showUnreadBadge ? (
                  <span className={`absolute right-2 top-2 inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${active ? "bg-white/20 text-white" : "bg-[color:var(--tbh-red)] text-white"}`}>
                    {unreadCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden rounded-xl border border-blue-900/20 bg-[color:var(--tbh-surface)] p-3 lg:block">
          <p className="mb-3 px-2 text-xs uppercase tracking-[0.14em] text-blue-100">Membre actif</p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const showUnreadBadge = item.href === "/notifications" && unreadCount > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${
                    active
                      ? "bg-[color:var(--tbh-red)] font-semibold text-white"
                      : "text-blue-100 hover:bg-[color:var(--tbh-surface-2)] hover:text-white"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <AppIcon name={item.icon} className="h-5 w-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {showUnreadBadge ? (
                    <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${active ? "bg-white/20 text-white" : "bg-[color:var(--tbh-red)] text-white"}`}>
                      {unreadCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-rose-700 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-900/30"
          >
            <AppIcon name="logout" className="h-5 w-5" />
            Déconnexion
          </button>
        </aside>

        <div>{children}</div>
      </div>

      <a
        href={helpHref}
        target={helpIsWhatsApp ? "_blank" : undefined}
        rel={helpIsWhatsApp ? "noreferrer" : undefined}
        className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg md:hidden"
      >
        <AppIcon name="help" className="h-5 w-5" /> Aide
      </a>
    </div>
  );
}
