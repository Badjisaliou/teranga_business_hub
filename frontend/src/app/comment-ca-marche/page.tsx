import PublicPage from "@/components/PublicPage";

const steps = ["Créer son compte et choisir son PIN", "Payer l’adhésion annuelle de 10 000 FCFA", "Recevoir son matricule et sa carte membre", "Choisir sa formule mensuelle", "Cotiser régulièrement pendant au moins 6 mois", "Structurer ou préparer son dossier", "Faire étudier manuellement son projet", "Signer le contrat en cas d’approbation", "Recevoir le financement et être accompagné"];

export default function HowItWorksPage() {
  return <PublicPage eyebrow="Comment ça marche ?" title="Un parcours transparent, de l’adhésion au projet." description="La plateforme gère l’adhésion et les cotisations. L’accompagnement, l’étude du projet, le contrat et le financement sont conduits manuellement par la structure."><ol className="grid gap-4 md:grid-cols-2">{steps.map((step, index) => <li key={step} className="flex gap-4 rounded-2xl border border-slate-200 p-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--tbh-red)] font-black text-white">{index + 1}</span><span className="pt-2 font-bold text-slate-800">{step}</span></li>)}</ol></PublicPage>;
}
