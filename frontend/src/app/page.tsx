import Image from "next/image";
import Link from "next/link";

const commitments = [
  "Adhesion simple, rapide et accessible",
  "Suivi transparent de vos cotisations et paiements",
  "Accompagnement d'une communaute solidaire et ambitieuse",
];

const highlights = [
  {
    title: "Vision",
    text: "Construire une communaute forte, structuree et credible autour de l'entraide, de la discipline financiere et de l'impact collectif.",
  },
  {
    title: "Mission",
    text: "Faciliter l'acces aux services financiers communautaires grace a une organisation claire, humaine et moderne pour chaque membre de TERANGA BUSINESS HUB.",
  },
  {
    title: "Valeurs",
    text: "Transparence, engagement, equite, responsabilite et esprit de teranga au coeur de chaque action.",
  },
];

const services = [
  "Inscription et integration des membres",
  "Paiement securise de l'adhesion et des cotisations",
  "Suivi detaille des versements effectues",
  "Carte membre et gestion du profil",
];

const steps = [
  "Creer votre compte en ligne en quelques minutes.",
  "Soumettre votre dossier pour validation administrative.",
  "Regler votre adhesion et suivre vos cotisations en toute simplicite.",
  "Profiter d'un espace membre moderne, fiable et transparent.",
];

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-transparent text-slate-900">
      <main className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-8 sm:px-6 sm:py-12 lg:gap-20">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,74,92,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(30,63,115,0.16),transparent_34%)]" />
          <div className="relative grid gap-10 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.02fr_0.98fr] lg:px-12 lg:py-14">
            <div className="flex flex-col justify-center gap-6">
              <div className="inline-flex w-fit items-center gap-3 rounded-full border border-[color:var(--tbh-red)]/20 bg-[color:var(--tbh-red)]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--tbh-navy)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--tbh-red)]" />
                Teranga Business Hub
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  L&apos;acces a la finance
                  <span className="block text-[color:var(--tbh-red)]">est accessible</span>
                  <span className="block text-[color:var(--tbh-navy)]">pour tout un chacun.</span>
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  TERANGA BUSINESS HUB met a votre disposition une plateforme moderne, rassurante et accessible pour
                  accompagner l&apos;adhesion, les cotisations et le suivi des membres avec professionnalisme.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {commitments.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 text-sm font-medium text-slate-700 shadow-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/register"
                  className="rounded-full bg-[color:var(--tbh-red)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(239,74,92,0.25)] transition hover:-translate-y-0.5 hover:opacity-95"
                >
                  Commencer l&apos;inscription
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-[color:var(--tbh-navy)]/20 bg-white px-6 py-3 text-sm font-semibold text-[color:var(--tbh-navy)] transition hover:bg-[color:var(--tbh-navy)] hover:text-white"
                >
                  Se connecter
                </Link>
              </div>
            </div>

            <div className="relative min-h-[460px] lg:min-h-[560px]">
              <div className="absolute left-0 top-6 hidden w-28 rounded-[1.6rem] border border-white/70 bg-white/90 p-4 shadow-xl sm:block">
                <Image
                  src="/tbh-logo-source.jpeg"
                  alt="Logo Teranga Business Hub"
                  width={220}
                  height={220}
                  className="h-auto w-full rounded-2xl object-contain"
                />
              </div>

              <div className="absolute inset-y-0 left-8 right-0 rounded-[2rem] bg-[linear-gradient(180deg,rgba(30,63,115,0.08),rgba(30,63,115,0))] sm:left-16" />

              <div className="absolute right-0 top-0 w-[78%] overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_20px_65px_rgba(15,23,42,0.18)]">
                <Image
                  src="/hero-flyer-1.jpeg"
                  alt="Visuel de presentation Teranga Business Hub"
                  width={900}
                  height={1200}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>

              <div className="absolute bottom-0 left-0 w-[58%] overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-[0_20px_65px_rgba(15,23,42,0.18)]">
                <Image
                  src="/hero-flyer-2.jpeg"
                  alt="Visuel financier Teranga Business Hub"
                  width={900}
                  height={1200}
                  className="h-auto w-full object-cover"
                />
              </div>

              <div className="absolute bottom-6 right-6 max-w-[16rem] rounded-[1.75rem] border border-white/70 bg-[color:var(--tbh-navy)] px-5 py-4 text-white shadow-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">Message cle</p>
                <p className="mt-2 text-lg font-bold leading-7">
                  Une organisation moderne au service d&apos;une finance plus proche, plus claire et plus accessible.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/90 p-8 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <div className="absolute inset-y-0 right-0 w-56 bg-[radial-gradient(circle,rgba(30,63,115,0.08),transparent_65%)]" />
            <div className="absolute right-6 top-6 opacity-[0.06]">
              <Image src="/tbh-logo.png" alt="" width={220} height={220} aria-hidden className="h-auto w-36" />
            </div>
            <div className="relative space-y-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--tbh-red)]">A propos</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
                  Une identite forte pour une communaute en pleine ambition
                </h2>
              </div>
              <p className="max-w-3xl text-base leading-8 text-slate-600">
                TERANGA BUSINESS HUB affirme ici une image plus institutionnelle, plus lisible et plus engageante.
                Cette presentation valorise votre mission, renforce la confiance et donne aux visiteurs une premiere
                impression plus credible de votre organisation.
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                {highlights.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,rgba(248,250,252,0.95))] p-5"
                  >
                    <h3 className="text-lg font-semibold text-[color:var(--tbh-navy)]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-[linear-gradient(160deg,var(--tbh-navy),#10284d)] p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Parcours membre</p>
            <ol className="mt-6 space-y-4">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[color:var(--tbh-navy)]">
                    0{index + 1}
                  </span>
                  <p className="text-sm leading-7 text-blue-50">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.1)]">
            <Image
              src="/hero-flyer-2.jpeg"
              alt="Presentation des services financiers Teranga Business Hub"
              width={900}
              height={1200}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="rounded-[2rem] border border-slate-200/70 bg-white/90 p-8 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--tbh-red)]">Nos services</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Des services clairs, utiles et accessibles</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Chaque service a ete presente de maniere simple et professionnelle afin de faciliter la comprehension,
              d&apos;instaurer la confiance et de mettre en valeur la qualite de votre accompagnement.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {services.map((service) => (
                <article
                  key={service}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 text-sm font-medium leading-7 text-slate-700"
                >
                  {service}
                </article>
              ))}
            </div>

            <div className="mt-8 rounded-[1.75rem] bg-[linear-gradient(135deg,rgba(239,74,92,0.08),rgba(30,63,115,0.08))] p-6">
              <h3 className="text-xl font-bold text-[color:var(--tbh-navy)]">Questions frequentes</h3>
              <div className="mt-4 space-y-3">
                <FaqItem
                  question="Quand mon compte devient-il actif ?"
                  answer="Apres validation administrative de l'inscription puis paiement reussi de l'adhesion."
                />
                <FaqItem
                  question="Puis-je regler plusieurs mois ?"
                  answer="Oui. Le systeme affecte le montant verse vers les mois les plus anciens non soldes."
                />
                <FaqItem
                  question="Pourquoi mon compte peut-il etre bloque ?"
                  answer="Un compte peut etre suspendu selon les regles de paiement et de conformite definies par la structure."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,var(--tbh-navy),#16305b_60%,#244b84)] px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.2)] sm:px-8 lg:px-10">
          <div className="absolute right-0 top-0 opacity-[0.08]">
            <Image src="/tbh-logo.png" alt="" width={420} height={420} aria-hidden className="h-auto w-64" />
          </div>
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">Besoin d&apos;aide ?</p>
              <h2 className="text-3xl font-bold sm:text-4xl">Une plateforme pensee pour inspirer confiance et faciliter l&apos;action</h2>
              <p className="max-w-3xl text-base leading-8 text-blue-50">
                Que vous soyez futur membre ou deja inscrit, tout a ete pense pour vous offrir une experience plus
                claire, plus elegante et plus coherente avec l&apos;image de TERANGA BUSINESS HUB.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[color:var(--tbh-navy)] transition hover:-translate-y-0.5"
              >
                Ouvrir un compte
              </Link>
              <Link
                href="/forgot-password"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Recuperer mon acces
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="rounded-2xl border border-white/60 bg-white px-5 py-4 shadow-sm">
      <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">{question}</summary>
      <p className="mt-3 text-sm leading-7 text-slate-600">{answer}</p>
    </details>
  );
}
