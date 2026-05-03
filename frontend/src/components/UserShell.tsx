"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest, clearAuthSession, getAuthToken } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/paiements/historique", label: "Historique paiements" },
  { href: "/cotisations", label: "Cotisations" },
  { href: "/cotisations/paiement", label: "Paiement cotisation" },
  { href: "/notifications", label: "Notifications" },
  { href: "/transparence", label: "Transparence" },
  { href: "/carte", label: "Carte membre" },
  { href: "/profil", label: "Mon profil" },
];

const SHELL_PATHS = ["/dashboard", "/paiements", "/cotisations", "/notifications", "/transparence", "/carte", "/profil"];

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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
      <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
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
              {item.label}
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
          Deconnexion
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden rounded-xl border border-blue-900/20 bg-[color:var(--tbh-surface)] p-3 md:block">
          <p className="mb-3 px-2 text-xs uppercase tracking-[0.14em] text-blue-100">Espace Membre</p>
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
                  <span>{item.label}</span>
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
            className="mt-4 w-full rounded-md border border-rose-700 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-900/30"
          >
            Deconnexion
          </button>
        </aside>

        <div>{children}</div>
      </div>
    </div>
  );
}
