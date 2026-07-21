import PublicPage from "@/components/PublicPage";

const principles = [["Étude humaine", "Chaque dossier est examiné manuellement selon les critères du programme."], ["Traçabilité", "Les adhésions, cotisations et paiements sont suivis dans l’espace membre."], ["Confidentialité", "Les projets et documents transmis ne doivent pas être rendus publics sans autorisation."], ["Décision encadrée", "Un financement dépend de l’éligibilité, de l’approbation du projet et de la disponibilité du fonds."]];

export default function GovernancePage() {
  return <PublicPage eyebrow="Gouvernance" title="Des règles claires pour protéger le fonds et les membres." description="La composition détaillée du comité, les critères et les procédures seront publiés après validation interne et juridique."><div className="grid gap-5 md:grid-cols-2">{principles.map(([title, text]) => <article key={title} className="rounded-2xl border border-slate-200 p-6"><h2 className="text-xl font-black text-[color:var(--tbh-navy)]">{title}</h2><p className="mt-3 leading-7 text-slate-600">{text}</p></article>)}</div></PublicPage>;
}
