import Image from "next/image";
import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[linear-gradient(135deg,rgba(15,33,63,0.96),rgba(30,63,115,0.94),rgba(36,75,132,0.94))] shadow-[0_14px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <div className="rounded-2xl border border-white/15 bg-white/8 p-1.5 transition group-hover:scale-[1.03] group-hover:bg-white/12">
            <Image src="/tbh-logo.png" alt="Logo Teranga Business Hub" width={48} height={48} className="rounded-xl bg-white object-contain p-1" />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--tbh-red)]">TBH</p>
            <p className="text-sm font-semibold text-white sm:text-base">Teranga Business Hub</p>
            <p className="hidden text-xs text-blue-100/75 sm:block">Finance accessible, communauté responsable</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="hidden rounded-full border border-white/12 bg-white/6 px-4 py-2 text-blue-50 transition hover:bg-white/12 md:inline-flex"
          >
            Accueil
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-blue-50 transition hover:bg-white/12"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[color:var(--tbh-red)] px-4 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(239,74,92,0.28)] transition hover:-translate-y-0.5 hover:opacity-95"
          >
            Inscription
          </Link>
        </nav>
      </div>
    </header>
  );
}
