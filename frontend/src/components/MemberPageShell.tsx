import Image from "next/image";
import { ReactNode } from "react";

type MemberPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  aside?: ReactNode;
};

export function MemberEmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-5 text-sm text-slate-600 shadow-sm">{children}</div>;
}

export function MemberMessage({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
}) {
  const className = {
    error: "border-rose-200 bg-rose-50 text-rose-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-blue-200 bg-blue-50 text-[color:var(--tbh-navy)]",
  }[tone];

  return <div className={`rounded-[1.25rem] border px-4 py-3 text-sm ${className}`}>{children}</div>;
}

export default function MemberPageShell({ eyebrow, title, description, children, aside }: MemberPageShellProps) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,var(--tbh-navy),#16305b_60%,#244b84)] px-6 py-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:px-8">
        <div className="absolute right-0 top-0 opacity-[0.08]">
          <Image src="/tbh-logo.png" alt="" width={320} height={320} aria-hidden className="h-auto w-44 sm:w-56" />
        </div>
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">{eyebrow}</p>
            <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
            <p className="max-w-3xl text-sm leading-7 text-blue-50/90 sm:text-base">{description}</p>
          </div>
          {aside ? <div className="relative">{aside}</div> : null}
        </div>
      </section>

      <section className="space-y-5">{children}</section>
    </div>
  );
}
