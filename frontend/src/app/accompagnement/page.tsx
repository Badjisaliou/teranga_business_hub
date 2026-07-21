import PublicPage from "@/components/PublicPage";
import { organization } from "@/lib/institution";

const services = ["Étude et clarification du projet", "Business Plan", "Prévisions financières", "Formalisation de l’activité", "Étude de marché", "Stratégie commerciale", "Community management", "Constitution du dossier"];

export default function SupportProjectPage() {
  return <PublicPage eyebrow="Accompagnement" title="Votre idée n’est pas encore structurée ?" description="Teranga Business Hub accompagne ses membres dans la construction et la formalisation de leur projet.">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{services.map((service) => <div key={service} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 font-bold text-slate-800">{service}</div>)}</div>
    <section className="mt-8 rounded-2xl bg-blue-50 p-5 text-sm leading-7 text-slate-700"><h2 className="font-black text-[color:var(--tbh-navy)]">À qui s’adresse l’accompagnement ?</h2><p className="mt-2">Il est inclus pour les membres, quelle que soit leur formule mensuelle, et commence après l’adhésion. Le parcours est adapté au projet ; son traitement initial est généralement estimé entre deux et trois mois et l’accompagnement global peut se poursuivre jusqu’à un an.</p><p className="mt-3">Les demandes sont traitées manuellement par téléphone, WhatsApp, email ou rendez-vous. L’acceptation dépend de l’étude du projet et des capacités d’accompagnement disponibles.</p></section>
    <a href={`mailto:${organization.emails.accompagnement}`} className="mt-6 inline-flex rounded-full bg-[color:var(--tbh-red)] px-6 py-3 font-bold text-white">Écrire à {organization.emails.accompagnement}</a>
  </PublicPage>;
}
