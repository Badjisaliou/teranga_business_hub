import Image from "next/image";
import { ReactNode } from "react";
import AppIcon, { AppIconName } from "@/components/ui/AppIcon";

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
  const icon: Record<typeof tone, AppIconName> = {
    error: "alert",
    success: "check",
    info: "notification",
  };

  return (
    <div className={`flex items-start gap-3 rounded-[1.25rem] border px-4 py-3 text-sm ${className}`}>
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80">
        <AppIcon name={icon[tone]} />
      </span>
      <div className="min-w-0 flex-1 leading-6">{children}</div>
    </div>
  );
}

export default function MemberPageShell({ eyebrow, title, description, children, aside }: MemberPageShellProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="relative overflow-hidden rounded-none bg-transparent px-0 py-1 text-slate-950 shadow-none sm:rounded-[2rem] sm:bg-[linear-gradient(135deg,var(--tbh-navy),#16305b_60%,#244b84)] sm:px-8 sm:py-8 sm:text-white sm:shadow-[0_18px_50px_rgba(15,23,42,0.14)] lg:shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
        <div className="absolute right-0 top-0 hidden opacity-[0.08] sm:block">
          <Image src="/tbh-logo.png" alt="" width={320} height={320} aria-hidden className="h-auto w-36 sm:w-56" />
        </div>
        <div className="relative grid gap-4 md:gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-2 sm:space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--tbh-red)] sm:text-sm sm:tracking-[0.22em] sm:text-blue-100">{eyebrow}</p>
            <h1 className="max-w-3xl text-2xl font-black tracking-tight sm:text-4xl">{title}</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7 sm:text-blue-50/90">{description}</p>
          </div>
          {aside ? <div className="relative">{aside}</div> : null}
        </div>
      </section>

      <section className="space-y-4 sm:space-y-5">{children}</section>
    </div>
  );
}
