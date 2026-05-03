import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.1)] backdrop-blur sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--tbh-red)]">Contact support</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">Support TERANGA BUSINESS HUB</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          Pour toute question liée à votre compte, à une cotisation, à un paiement ou à l’utilisation de la
          plateforme, merci de contacter l’équipe de support de TERANGA BUSINESS HUB via les canaux officiels de
          la structure.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
            <h2 className="text-lg font-semibold text-[color:var(--tbh-navy)]">Assistance compte membre</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Demandes de connexion, récupération d’accès, validation de dossier, statut du compte.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
            <h2 className="text-lg font-semibold text-[color:var(--tbh-navy)]">Assistance paiements</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Vérification d’un paiement, suivi de cotisation, question sur une opération ou un justificatif.
            </p>
          </article>
        </div>

        <div className="mt-8 rounded-[1.75rem] bg-[linear-gradient(135deg,rgba(239,74,92,0.08),rgba(30,63,115,0.08))] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--tbh-red)]">Information utile</p>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Les coordonnées de support affichables publiquement n’étant pas encore définies dans l’application, cette
            page renvoie pour l’instant vers les canaux officiels communiqués par TERANGA BUSINESS HUB.
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex rounded-full bg-[color:var(--tbh-red)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Retour à l’accueil
          </Link>
        </div>
      </section>
    </div>
  );
}
