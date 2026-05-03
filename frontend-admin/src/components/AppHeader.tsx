import Image from "next/image";
import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-blue-900/30 bg-[color:var(--tbh-surface)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/tbh-logo.png" alt="Logo Teranga Business Hub" width={42} height={42} className="rounded-md" />
          <div className="leading-tight">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--tbh-red)]">TBH</p>
            <p className="text-sm font-semibold text-white sm:text-base">Admin Portal</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="rounded-md border border-blue-200/60 px-3 py-2 text-blue-50 hover:bg-blue-800/40">
            Dashboard
          </Link>
          <Link href="/login" className="rounded-md bg-[color:var(--tbh-red)] px-3 py-2 font-semibold text-white hover:opacity-90">
            Connexion
          </Link>
        </nav>
      </div>
    </header>
  );
}
