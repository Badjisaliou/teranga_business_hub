import Link from "next/link";

const termsItems = [
  "L'application est reservee aux usages lies aux services et activites de TERANGA BUSINESS HUB.",
  "Chaque utilisateur est responsable de l'exactitude des informations qu'il transmet lors de son inscription et de l'utilisation de son espace personnel.",
  "L'acces a certaines fonctionnalites peut dependre du statut du compte et du respect des regles internes de la structure.",
  "TERANGA BUSINESS HUB peut suspendre ou limiter un acces en cas de non-respect des regles applicables ou de situation administrative necessitant verification.",
];

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.1)] backdrop-blur sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--tbh-red)]">Conditions</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">Conditions d’utilisation</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          L’utilisation de cette application implique le respect des règles de fonctionnement définies par TERANGA
          BUSINESS HUB pour la gestion de ses membres et de ses opérations.
        </p>

        <div className="mt-8 space-y-4">
          {termsItems.map((item) => (
            <article key={item} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 text-sm leading-7 text-slate-700">
              {item}
            </article>
          ))}
        </div>

        <p className="mt-8 text-sm leading-7 text-slate-600">
          Ces conditions sont volontairement simples dans l’application et pourront être détaillées davantage sur le
          site vitrine de TERANGA BUSINESS HUB.
        </p>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex rounded-full border border-[color:var(--tbh-navy)]/20 bg-white px-6 py-3 text-sm font-semibold text-[color:var(--tbh-navy)] transition hover:bg-[color:var(--tbh-navy)] hover:text-white"
          >
            Retour à l’accueil
          </Link>
        </div>
      </section>
    </div>
  );
}
