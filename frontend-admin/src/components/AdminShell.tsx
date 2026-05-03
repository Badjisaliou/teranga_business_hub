"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/users", label: "Utilisateurs" },
  { href: "/settings", label: "Paramètres" },
  { href: "/register", label: "Inscription" },
];

const SHELL_PATHS = ["/dashboard", "/users", "/settings", "/register"];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldShowShell = SHELL_PATHS.some((path) => pathname.startsWith(path));

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
        </aside>

        <div>{children}</div>
      </div>
    </div>
  );
}
