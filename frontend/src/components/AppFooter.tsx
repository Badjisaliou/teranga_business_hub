import Link from "next/link";

export default function AppFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(241,246,255,0.96))] backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[color:var(--tbh-navy)]">Teranga Business Hub</p>
          <p className="mt-1 text-sm text-slate-600">Plateforme de gestion des membres, cotisations et transparence.</p>
          <p className="text-xs text-slate-500">Identification simple de la structure TERANGA BUSINESS HUB.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <Link href="/support" className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 transition hover:border-[color:var(--tbh-red)] hover:text-[color:var(--tbh-red)]">
            Contact support
          </Link>
          <Link
            href="/politique-confidentialite"
            className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 transition hover:border-[color:var(--tbh-red)] hover:text-[color:var(--tbh-red)]"
          >
            Politique de confidentialité
          </Link>
          <Link
            href="/conditions-utilisation"
            className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 transition hover:border-[color:var(--tbh-red)] hover:text-[color:var(--tbh-red)]"
          >
            Conditions d’utilisation
          </Link>
        </div>

        <div className="text-xs text-slate-500 lg:text-right">
          <p>Interface digitale inspiree de vos visuels de communication.</p>
          <p className="mt-1">© TERANGA BUSINESS HUB</p>
        </div>
      </div>
    </footer>
  );
}
