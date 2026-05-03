import Link from "next/link";

const privacyItems = [
  "Les informations renseignees dans l'application sont utilisees uniquement pour la gestion des membres, des adhesions, des cotisations et des services associes.",
  "TERANGA BUSINESS HUB limite l'acces aux donnees aux personnes habilitees dans le cadre du fonctionnement de la structure.",
  "Les donnees ne sont pas destinees a un usage commercial externe non lie aux services proposes par la plateforme.",
  "L'utilisateur peut demander une mise a jour de ses informations en contactant la structure par les canaux officiels.",
];

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.1)] backdrop-blur sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--tbh-red)]">Confidentialité</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">Politique de confidentialité</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          TERANGA BUSINESS HUB veille à une utilisation responsable des informations collectées dans l’application.
          Cette page présente les principes généraux appliqués à la protection des données des membres.
        </p>

        <div className="mt-8 space-y-4">
          {privacyItems.map((item) => (
            <article key={item} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 text-sm leading-7 text-slate-700">
              {item}
            </article>
          ))}
        </div>

        <p className="mt-8 text-sm leading-7 text-slate-600">
          Cette politique constitue une base d’information dans l’application et pourra être complétée par une version
          détaillée sur le futur site vitrine de la structure.
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
