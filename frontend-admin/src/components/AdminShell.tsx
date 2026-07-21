"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminUser, apiRequest, clearAdminSession, getAdminToken, getAdminUser } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/users", label: "Membres" },
  { href: "/finance", label: "Finance" },
  { href: "/settings", label: "Paramètres" },
  { href: "/register", label: "Inscription" },
];

const SHELL_PATHS = ["/dashboard", "/users", "/finance", "/settings", "/register"];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const shouldShowShell = SHELL_PATHS.some((path) => pathname.startsWith(path));
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    setUser(getAdminUser());
  }, [pathname]);

  async function logout() {
    const token = getAdminToken();
    try {
      if (token) {
        await apiRequest("/api/logout", { method: "POST" }, token);
      }
    } catch {
      // Local cleanup remains enough if the token is already invalid.
    } finally {
      clearAdminSession();
      setUser(null);
      router.push("/login");
    }
  }

  if (!shouldShowShell) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
      <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-md border px-3 py-2 text-sm ${
                active
                  ? "border-[color:var(--tbh-red)] bg-[color:var(--tbh-red)] text-white"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden rounded-xl border border-blue-900/20 bg-[color:var(--tbh-surface)] p-3 md:block">
          <p className="mb-3 px-2 text-xs uppercase tracking-[0.14em] text-blue-100">Navigation Admin</p>
          {user ? (
            <div className="mb-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-blue-50">
              <p className="text-xs text-blue-100/70">Connecte</p>
              <p className="truncate font-semibold">{user.prenom} {user.nom}</p>
            </div>
          ) : null}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-md px-3 py-2 text-sm ${
                    active
                      ? "bg-[color:var(--tbh-red)] font-semibold text-white"
                      : "text-blue-100 hover:bg-[color:var(--tbh-surface-2)] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {user ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="mt-4 w-full rounded-md border border-rose-700 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-900/30"
            >
              Déconnexion
            </button>
          ) : null}
        </aside>

        <div>{children}</div>
      </div>
    </div>
  );
}
