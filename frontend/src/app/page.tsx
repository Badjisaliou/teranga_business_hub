import Image from "next/image";
import Link from "next/link";
import ContributionPlans from "@/components/ContributionPlans";
import { PaymentMethodsSection } from "@/components/PaymentMethodsSection";
import { organization, formatFcfa } from "@/lib/institution";
import { getSupportHelpHref } from "@/lib/support";

const journey = ["Inscription et choix du PIN", "Adhésion annuelle", "Matricule et carte membre", "Choix de la formule mensuelle", "6 mois minimum de cotisations", "Préparation ou structuration du dossier", "Étude manuelle du projet", "Contrat et financement éventuel"];
const strengths = [["Un fonds solidaire", "Les cotisations contribuent à un mécanisme collectif destiné à soutenir des projets viables."], ["Un accompagnement humain", "Une idée non structurée peut être accompagnée pour devenir un dossier clair et exploitable."], ["Une plateforme simple", "Chaque membre suit ses cotisations, paiements, notifications et sa carte numérique."], ["Des décisions encadrées", "L’adhésion et la cotisation ne garantissent pas un financement : chaque projet est étudié."]];

export default function HomePage() {
  const helpHref = getSupportHelpHref("Bonjour, je souhaite avoir des informations sur Teranga Business Hub.");
  return <div className="bg-white text-slate-950">
    <section className="relative overflow-hidden bg-[color:var(--tbh-navy)] text-white">
      <Image src="/tbh/hero-communaute.png" alt="Communauté d’entrepreneurs de Teranga Business Hub" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,20,42,.94),rgba(8,20,42,.62),rgba(8,20,42,.28))]" />
      <div className="relative mx-auto flex min-h-[720px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-4xl"><p className="inline-flex rounded-full border border-red-300/40 bg-red-500/20 px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-red-100">Financement solidaire & fonds rotatif</p><h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">Cotisez ensemble.<br /><span className="text-red-300">Financez des projets viables.</span><br />Faites circuler l’impact.</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-blue-50">{organization.name} mobilise une communauté d’entrepreneurs autour d’un fonds rotatif solidaire : les ressources collectives soutiennent, sous conditions, des projets étudiés et accompagnés pour créer un impact durable.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="rounded-full bg-[color:var(--tbh-red)] px-6 py-3 font-bold text-white">Rejoindre le fonds solidaire</Link><Link href="/comment-ca-marche" className="rounded-full bg-white px-6 py-3 font-bold text-[color:var(--tbh-navy)]">Comprendre le mécanisme</Link><a href={helpHref} className="rounded-full border border-white/25 px-6 py-3 font-bold">Parler à l’équipe</a></div><div className="mt-8 flex flex-wrap gap-3 text-sm"><span className="rounded-xl bg-white/10 px-4 py-3">Adhésion : {formatFcfa(organization.adhesionAmount)}/an</span><span className="rounded-xl bg-white/10 px-4 py-3">Cotisation : 5 000, 10 000 ou 20 000 FCFA/mois</span><span className="rounded-xl border border-red-300/30 bg-red-500/15 px-4 py-3 font-bold text-red-100">Financement solidaire sous conditions</span></div></div>
      </div>
    </section>

    <section className="relative overflow-hidden bg-gradient-to-br from-red-700 via-red-600 to-orange-500 px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border-[48px] border-white/10" />
      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[.2em] text-red-100">Le cœur du modèle TBH</p>
          <h2 className="mt-3 text-3xl font-black sm:text-5xl">Un financement solidaire porté par un fonds rotatif.</h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-red-50">Les cotisations alimentent une dynamique collective. Après étude, les ressources disponibles peuvent soutenir des projets viables ; les remboursements reviennent ensuite dans le fonds afin d’accompagner progressivement d’autres membres.</p>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {[["1", "La communauté cotise", "Chaque membre contribue selon la formule mensuelle qu’il a choisie."], ["2", "Les projets sont étudiés", "L’éligibilité, la viabilité et la capacité de remboursement sont examinées avant toute décision."], ["3", "Le fonds se renouvelle", "Les remboursements reconstituent les ressources mobilisables pour de futurs projets."]].map(([number, title, text]) => <article key={number} className="rounded-[1.75rem] border border-white/20 bg-white/10 p-6 backdrop-blur-sm"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg font-black text-red-700">{number}</span><h3 className="mt-5 text-xl font-black">{title}</h3><p className="mt-3 leading-7 text-red-50">{text}</p></article>)}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-4"><Link href="/comment-ca-marche" className="rounded-full bg-white px-6 py-3 font-bold text-red-700">Voir comment cela fonctionne</Link><p className="max-w-2xl text-sm leading-6 text-red-50">L’adhésion et les cotisations ne constituent pas une garantie de financement. Chaque demande reste soumise aux critères, aux ressources disponibles et à une décision formalisée.</p></div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="max-w-3xl"><p className="text-sm font-black uppercase tracking-[.18em] text-[color:var(--tbh-red)]">Notre approche</p><h2 className="mt-3 text-3xl font-black sm:text-5xl">Plus qu’une cotisation : un parcours entrepreneurial.</h2></div><div className="mt-8 grid gap-5 md:grid-cols-2">{strengths.map(([title, text]) => <article key={title} className="rounded-[1.75rem] border border-slate-200 p-6"><h3 className="text-xl font-black text-[color:var(--tbh-navy)]">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></article>)}</div></section>

    <section className="overflow-hidden bg-[color:var(--tbh-navy)] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        <div className="relative">
          <div className="absolute -inset-8 rounded-full bg-red-600/20 blur-3xl" />
          <Image src="/tbh/carte-sira-reference.jpeg" alt="Carte virtuelle SIRA de Teranga Business Hub" width={1280} height={853} className="relative h-auto w-full rounded-[2rem] border border-white/15 shadow-2xl" />
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[.18em] text-red-300">Carte membre officielle</p>
          <h2 className="mt-3 text-3xl font-black sm:text-5xl">La Carte SIRA, votre accès aux ressources TBH.</h2>
          <p className="mt-5 leading-8 text-blue-50">SIRA signifie « Solution innovante pour une réussite associative ». La carte virtuelle est incluse dans l’adhésion annuelle de {formatFcfa(organization.card.annualFee)} et reste valable {organization.card.validityMonths} mois.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {["Espace membre sécurisé", "Matricule et QR code", `${organization.card.includedTrainings} formations incluses par an`, "Certifications de formation", "Accès aux ressources TBH", "Réseau et activités disponibles"].map((advantage) => <li key={advantage} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/8 p-4 text-sm font-bold"><span className="mt-0.5 text-red-300">✓</span><span>{advantage}</span></li>)}
          </ul>
          <Link href="/carte-membre" className="mt-7 inline-flex rounded-full bg-[color:var(--tbh-red)] px-6 py-3 font-bold text-white">Découvrir tous les avantages</Link>
        </div>
      </div>
    </section>

    <section className="border-y border-emerald-100 bg-emerald-50 px-4 py-14 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-sm font-black uppercase tracking-[.18em] text-emerald-700">Protection du membre non financé</p><h2 className="mt-3 text-3xl font-black text-[color:var(--tbh-navy)]">Un remboursement peut être demandé après 24 mensualités.</h2><p className="mt-4 max-w-4xl leading-8 text-slate-700">Le membre qui n’a reçu aucun financement peut, après vingt-quatre mensualités complètes et sous réserve des conditions du règlement, demander le remboursement de ses cotisations mensuelles éligibles. L’adhésion annuelle et les services déjà fournis ne sont pas remboursés.</p><p className="mt-3 text-sm font-semibold text-emerald-900">Après validation d’une demande complète, le paiement est prévu en une seule fois sous 30 jours, déduction faite des frais réels de transfert.</p><p className="mt-2 text-xs text-slate-600">Cette règle reste soumise à la validation juridique et réglementaire définitive du programme.</p></div><Link href="/reglement-programme" className="inline-flex rounded-full bg-emerald-700 px-6 py-3 font-bold text-white">Consulter les conditions</Link></div></section>

    <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="text-sm font-black uppercase tracking-[.18em] text-[color:var(--tbh-red)]">Trois formules</p><h2 className="mt-3 text-3xl font-black sm:text-5xl">Choisissez votre engagement mensuel.</h2><p className="mt-4 leading-8 text-slate-600">Le choix est effectué dans l’espace membre avant le premier paiement.</p></div><div className="mt-8"><ContributionPlans /></div></div></section>

    <PaymentMethodsSection />

    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8"><Image src="/tbh/accompagnement-entrepreneur.png" alt="Accompagnement d’un entrepreneur" width={1600} height={1000} className="rounded-[2rem] object-cover shadow-xl" /><div><p className="text-sm font-black uppercase tracking-[.18em] text-[color:var(--tbh-red)]">Votre idée mérite une structure</p><h2 className="mt-3 text-3xl font-black sm:text-5xl">Vous n’avez pas encore de Business Plan ?</h2><p className="mt-5 leading-8 text-slate-600">Notre équipe prévoit d’accompagner les porteurs d’idées dans la clarification du projet, l’étude de marché, le Business Plan, les prévisions financières et la préparation du dossier.</p><p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-slate-700">Cet accompagnement, comme l’étude des candidatures, est géré manuellement par la structure.</p><Link href="/accompagnement" className="mt-6 inline-flex rounded-full bg-[color:var(--tbh-navy)] px-6 py-3 font-bold text-white">Découvrir l’accompagnement</Link></div></section>

    <section className="bg-[color:var(--tbh-navy)] px-4 py-16 text-white sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-sm font-black uppercase tracking-[.18em] text-blue-100">Le parcours</p><h2 className="mt-3 text-3xl font-black sm:text-5xl">De l’adhésion à l’étude du projet.</h2><p className="mt-5 leading-8 text-blue-50">La plateforme simplifie les opérations courantes. Les décisions liées aux projets restent humaines et encadrées.</p></div><ol className="grid gap-3 sm:grid-cols-2">{journey.map((step, index) => <li key={step} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white font-black text-[color:var(--tbh-navy)]">{index + 1}</span><span className="text-sm font-bold">{step}</span></li>)}</ol></div></section>

    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="grid gap-6 lg:grid-cols-3"><Link href="/equipe" className="rounded-[1.75rem] border border-slate-200 p-6"><h2 className="text-2xl font-black">Notre équipe</h2><p className="mt-3 leading-7 text-slate-600">Découvrez progressivement les personnes chargées de la direction, des opérations, de la technique et de l’accompagnement.</p></Link><Link href="/candidature" className="rounded-[1.75rem] border border-slate-200 p-6"><h2 className="text-2xl font-black">Préparer sa candidature</h2><p className="mt-3 leading-7 text-slate-600">Consultez les pièces généralement nécessaires avant l’étude manuelle d’un projet.</p></Link><Link href="/faq" className="rounded-[1.75rem] border border-slate-200 p-6"><h2 className="text-2xl font-black">Questions fréquentes</h2><p className="mt-3 leading-7 text-slate-600">Adhésion, cotisations, accompagnement et financement : retrouvez les réponses essentielles.</p></Link></div></section>
  </div>;
}
