import PublicPage from "@/components/PublicPage";

const questions = [
  ["L’adhésion garantit-elle un financement ?", "Non. Elle donne accès au statut de membre et à la plateforme. Toute demande de financement reste soumise aux règles du programme, à l’étude du projet et à la disponibilité du fonds."],
  ["Quel est le montant de l’adhésion ?", "L’adhésion annuelle est de 10 000 FCFA."],
  ["Quelles sont les cotisations mensuelles ?", "Un membre actif choisit 5 000, 10 000 ou 20 000 FCFA par mois avant son premier paiement."],
  ["Que se passe-t-il si je ne reçois aucun financement ?", "Après vingt-quatre mensualités complètes sans financement, le membre peut demander le remboursement de ses cotisations mensuelles éligibles, sous réserve des conditions du règlement. Après validation d’une demande complète, le paiement est prévu en une seule fois sous 30 jours, déduction faite des frais réels de transfert. L’adhésion annuelle n’est pas remboursée."],
  ["Je n’ai pas encore de Business Plan. Puis-je être accompagné ?", "Oui. Après son adhésion, un membre de toute formule peut demander un accompagnement manuel pour structurer son projet et préparer son dossier."],
  ["Comment déposer une candidature ?", "La réception et l’étude des dossiers sont actuellement gérées manuellement par la structure. Contactez l’équipe pour connaître la procédure à suivre."],
  ["Quand puis-je demander un financement ?", "Une candidature nécessite au moins six mois de cotisations et un dossier complet. Cette durée ne garantit pas un financement et le volet de financement ne sera ouvert qu’après validation du cadre réglementaire."],
];

export default function FaqPage() {
  return <PublicPage eyebrow="Questions fréquentes" title="Des réponses simples avant de vous engager." description="Les réponses ci-dessous présentent le fonctionnement actuellement confirmé."><div className="space-y-3">{questions.map(([question, answer]) => <details key={question} className="group rounded-2xl border border-slate-200 p-5"><summary className="cursor-pointer list-none font-black text-slate-900">{question}<span className="float-right text-[color:var(--tbh-red)]">+</span></summary><p className="mt-4 max-w-4xl leading-7 text-slate-600">{answer}</p></details>)}</div></PublicPage>;
}
