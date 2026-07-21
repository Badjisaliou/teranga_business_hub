import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import AppIcon, { AppIconName } from "@/components/ui/AppIcon";

type ActionLink = {
  href: string;
  label: string;
};

type PublicAuthLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  variant?: "marketing" | "process";
  imageSrc?: string;
  imageAlt?: string;
  badge?: string;
  points?: string[];
  accent?: "navy" | "red";
  footerLinks?: ActionLink[];
};

export const formFieldClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--tbh-red)] focus:ring-4 focus:ring-[color:var(--tbh-red)]/10";

export function FeedbackMessage({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
}) {
  const tones = {
    error: "border-rose-200 bg-rose-50 text-rose-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-blue-200 bg-blue-50 text-[color:var(--tbh-navy)]",
  }[tone];
  const icons: Record<typeof tone, AppIconName> = {
    error: "alert",
    success: "check",
    info: "notification",
  };

  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${tones}`}>
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80">
        <AppIcon name={icons[tone]} />
      </span>
      <div className="min-w-0 flex-1 leading-6">{children}</div>
    </div>
  );
}

export default function PublicAuthLayout({
  eyebrow,
  title,
  description,
  children,
  variant = "marketing",
  imageSrc = "/hero-flyer-1.jpeg",
  imageAlt = "Teranga Business Hub",
  badge = "Teranga Business Hub",
  points = [],
  accent = "navy",
  footerLinks = [],
}: PublicAuthLayoutProps) {
  if (variant === "process") {
    return (
      <main className="min-h-screen bg-white px-4 py-5 text-slate-950 sm:px-6 sm:py-8">
        <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-md flex-col">
          <header className="mb-7 flex items-center justify-between gap-4">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <Image src="/tbh-logo.png" alt="Logo Teranga Business Hub" width={44} height={44} priority className="h-11 w-11 rounded-lg bg-white object-contain" />
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--tbh-red)]">TBH</span>
                <span className="block truncate text-sm font-bold text-[color:var(--tbh-navy)]">Teranga Business Hub</span>
              </span>
            </Link>
          </header>

          <section className="flex-1">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tbh-red)]">{eyebrow}</p>
              <h1 className="mt-2 text-2xl font-black leading-tight text-slate-950">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>

            {children}
          </section>

          {footerLinks.length > 0 ? (
            <footer className="mt-8 flex flex-wrap gap-4 border-t border-slate-200 pt-5 text-sm">
              {footerLinks.map((link) => (
                <Link key={link.href} href={link.href} className="font-semibold text-[color:var(--tbh-red)] transition hover:opacity-80">
                  {link.label}
                </Link>
              ))}
            </footer>
          ) : null}
        </div>
      </main>
    );
  }

  const accentClass =
    accent === "red"
      ? "from-[color:var(--tbh-red)] via-[#f26a78] to-[color:var(--tbh-navy)]"
      : "from-[color:var(--tbh-navy)] via-[#285391] to-[#10284d]";

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${accentClass} p-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] sm:p-10`}>
          <div className="absolute right-0 top-0 opacity-[0.08]">
            <Image src="/tbh-logo.png" alt="" width={360} height={360} aria-hidden className="h-auto w-48 sm:w-64" />
          </div>

          <div className="relative flex h-full flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-50">
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
              {badge}
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">{eyebrow}</p>
              <h1 className="max-w-xl text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
              <p className="max-w-2xl text-base leading-8 text-blue-50/90">{description}</p>
            </div>

            {points.length > 0 ? (
              <div className="grid gap-3">
                {points.map((point) => (
                  <div key={point} className="flex items-start gap-3 rounded-2xl border border-white/12 bg-white/8 px-4 py-4 text-sm leading-7 text-blue-50">
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/14 text-white">
                      <AppIcon name="check" className="h-4 w-4" />
                    </span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-auto overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
              <Image
                src={imageSrc}
                alt={imageAlt}
                width={900}
                height={1200}
                className="h-[280px] w-full rounded-[1.25rem] object-cover sm:h-[340px]"
              />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/88 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8 lg:p-10">
          <div className="absolute right-0 top-0 h-56 w-56 bg-[radial-gradient(circle,rgba(239,74,92,0.12),transparent_70%)]" />
          <div className="absolute left-0 bottom-0 h-56 w-56 bg-[radial-gradient(circle,rgba(30,63,115,0.10),transparent_70%)]" />

          <div className="relative flex min-h-full flex-col">
            <div className="mb-6 flex items-center gap-3">
              <Image src="/tbh-logo.png" alt="Logo Teranga Business Hub" width={56} height={56} className="h-14 w-14 rounded-xl bg-white object-contain p-1 shadow-sm" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--tbh-red)]">TBH</p>
                <p className="text-base font-semibold text-[color:var(--tbh-navy)]">Teranga Business Hub</p>
              </div>
            </div>

            {children}

            {footerLinks.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-200 pt-5 text-sm">
                {footerLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="font-semibold text-[color:var(--tbh-red)] transition hover:opacity-80">
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
