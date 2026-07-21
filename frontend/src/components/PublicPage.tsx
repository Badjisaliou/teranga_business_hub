import Link from "next/link";
import { ReactNode } from "react";
import { getSupportHelpHref } from "@/lib/support";

export default function PublicPage({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <div className="bg-white text-slate-950">
      <section className="bg-[color:var(--tbh-navy)] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-100">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-blue-50 sm:text-lg">{description}</p>
        </div>
      </section>
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">{children}</div>
      <section className="bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-[2rem] bg-[color:var(--tbh-navy)] p-7 text-white sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-2xl font-black">Parlons de votre projet</h2><p className="mt-2 text-sm text-blue-50">Notre équipe vous oriente selon votre situation et le niveau de maturité de votre projet.</p></div>
          <div className="flex flex-wrap gap-3"><Link href="/register" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[color:var(--tbh-navy)]">Devenir membre</Link><a href={getSupportHelpHref()} className="rounded-full border border-white/25 px-5 py-3 text-sm font-bold">Contacter l’équipe</a></div>
        </div>
      </section>
    </div>
  );
}
