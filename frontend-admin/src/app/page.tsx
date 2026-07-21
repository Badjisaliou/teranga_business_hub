import Link from "next/link";
import Card from "@/components/ui/Card";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-20">
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--tbh-red)]">Teranga Business Hub</p>
          <h1 className="text-4xl font-bold tracking-tight">Application Admin</h1>
          <p className="mx-auto max-w-2xl text-slate-600">
            Connectez-vous pour accéder aux services d&apos;administration. Les écrans métier sont réservés aux
            comptes admin actifs.
          </p>
        </div>

        <Card className="mx-auto w-full max-w-2xl">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/register" className="rounded-lg border border-[color:var(--tbh-border)] px-4 py-3 text-center font-semibold text-[color:var(--tbh-text-soft)] hover:text-white">
              Inscrire un administrateur
            </Link>
            <Link href="/login" className="rounded-lg bg-[color:var(--tbh-red)] px-4 py-3 text-center font-semibold text-white hover:opacity-90">
              Connexion admin
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
