import PublicPage from "@/components/PublicPage";
import { organization } from "@/lib/institution";

const topics = ["Comptabilité et finance", "Communication d’entreprise", "Marketing et communication", "Transformation des produits locaux", "Marketing digital", "Entrepreneuriat", "Développement personnel", "Métiers du BTP", "Artisanat"];

export default function TrainingPage() {
  return <PublicPage eyebrow="Formations" title="Renforcer les compétences derrière chaque projet." description="Trois formations certifiantes sont prévues par année d’adhésion pour les membres disposant d’une Carte SIRA valide.">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{topics.map((topic) => <div key={topic} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-lg font-black text-[color:var(--tbh-navy)]">{topic}</div>)}</div>
    <section className="mt-8 rounded-[1.75rem] bg-blue-50 p-6"><h2 className="text-xl font-black text-[color:var(--tbh-navy)]">Modalités confirmées</h2><ul className="mt-4 grid gap-3 text-sm leading-7 text-slate-700 sm:grid-cols-2"><li>✓ Format hybride</li><li>✓ Sessions en présentiel dans les locaux de TBH</li><li>✓ Inscription réservée aux membres avec Carte SIRA valide</li><li>✓ Participation à toutes les séances requise pour la certification</li></ul><p className="mt-4 text-sm text-slate-600">Le calendrier, les formateurs et les éventuels coûts propres à une session sont communiqués avant l’inscription.</p></section>
    <a href={`mailto:${organization.emails.formation}`} className="mt-8 inline-flex rounded-full bg-[color:var(--tbh-red)] px-6 py-3 font-bold text-white">Écrire à {organization.emails.formation}</a>
  </PublicPage>;
}
