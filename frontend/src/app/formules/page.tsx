import ContributionPlans from "@/components/ContributionPlans";
import PublicPage from "@/components/PublicPage";

export default function PlansPage() {
  return <PublicPage eyebrow="Formules de cotisation" title="Choisissez un engagement adapté à votre projet." description="Après son adhésion, chaque membre actif choisit une cotisation mensuelle de 5 000, 10 000 ou 20 000 FCFA avant son premier paiement."><ContributionPlans /><div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950"><strong>À retenir :</strong> cotiser ne garantit pas automatiquement un financement. Toute demande dépend de la durée de cotisation, de l’étude du dossier, de l’approbation du projet et de la disponibilité du fonds.</div></PublicPage>;
}
