import Link from "next/link";
import AppIcon from "@/components/ui/AppIcon";
import { getSupportHelpHref, isSupportWhatsAppConfigured } from "@/lib/support";
import { organization } from "@/lib/institution";

export default function SupportPage() {
  const helpHref = getSupportHelpHref("Bonjour, j'ai besoin d'aide avec mon compte Teranga Business Hub.");
  const helpIsWhatsApp = isSupportWhatsAppConfigured();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.1)] backdrop-blur sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--tbh-red)]">Contact support</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">Support TERANGA BUSINESS HUB</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          Pour toute question liee a votre compte, a une cotisation, a un paiement ou a l'utilisation de la plateforme, contactez l'equipe de support via les canaux officiels.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[color:var(--tbh-navy)] shadow-sm">
              <AppIcon name="profile" className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-[color:var(--tbh-navy)]">Assistance compte membre</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Connexion, recuperation de PIN, matricule, carte membre, compte bloque ou informations personnelles.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[color:var(--tbh-navy)] shadow-sm">
              <AppIcon name="wallet" className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-[color:var(--tbh-navy)]">Assistance paiements</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Verification d'un paiement, suivi de cotisation, question sur une operation ou un justificatif.
            </p>
          </article>
        </div>

        <div className="mt-8 rounded-[1.75rem] bg-[linear-gradient(135deg,rgba(239,74,92,0.08),rgba(30,63,115,0.08))] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--tbh-red)]">Information utile</p>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Si le numero WhatsApp de support est configure, le bouton ci-dessous ouvre directement WhatsApp. Sinon, cette page reste le point de contact public.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={helpHref}
            target={helpIsWhatsApp ? "_blank" : undefined}
            rel={helpIsWhatsApp ? "noreferrer" : undefined}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            <AppIcon name="help" />
            Aide WhatsApp
          </a>
          <a href={`mailto:${organization.emails.support}`} className="inline-flex rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700">
            {organization.emails.support}
          </a>
          <Link
            href="/"
            className="inline-flex rounded-full bg-[color:var(--tbh-red)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Retour a l'accueil
          </Link>
        </div>
      </section>
    </div>
  );
}
