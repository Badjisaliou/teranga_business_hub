import PublicPage from "@/components/PublicPage";

const rules = [
  ["Adhésion et carte", "10 000 FCFA par an, Carte SIRA incluse, validité de douze mois et renouvellement annuel."],
  ["Échéance mensuelle", "Première cotisation un mois après l’adhésion. Paiement au plus tard le 15, avec délai de grâce jusqu’au 20 inclus."],
  ["Retard", "Un mois impayé suspend la progression mais ne remet pas les mois validés à zéro. La régularisation permet de poursuivre le cycle."],
  ["Changement de formule", "Augmentations multiples autorisées vers une formule supérieure, effet le mois suivant. Aucune diminution et aucune rétroactivité. En attendant l’automatisation, la demande est traitée manuellement par TBH."],
  ["Remboursement après 24 mensualités", "Le membre non financé peut demander le remboursement après 24 mensualités complètes. Paiement unique sous 30 jours après validation, frais réels de transfert déduits."],
  ["Départ volontaire", "Avant acquisition d’un droit au remboursement, les cotisations déjà affectées au programme restent acquises au fonds."],
  ["Candidature", "Au moins six mois de cotisations et un dossier complet. Décision du comité sous cinq jours ouvrés après déclaration de complétude."],
  ["Évaluation", "Minimum trois évaluateurs. Seuil de 65/100, dont 24/40 en viabilité et 8/15 en risques et conformité. Capacité de remboursement obligatoire."],
  ["Projet non formalisé", "Étude possible avec engagement de formalisation, mais RCCM, NINEA et autorisations sont obligatoires avant tout décaissement."],
  ["Financement", "Aucun financement automatique. Les conditions sont négociées au cas par cas, avec sept jours de réflexion et signature manuelle du contrat avant décaissement."],
];

export default function ProgramRulesPage() {
  return <PublicPage eyebrow="Programme solidaire" title="Règlement du programme" description="Les règles métier confirmées concernant l’adhésion, les cotisations, les candidatures et les remboursements."><p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold leading-7 text-red-950">Le volet de financement remboursable ne sera ouvert qu’après obtention de l’agrément requis ou validation écrite d’un montage réglementaire conforme.</p><div className="mt-7 grid gap-4 md:grid-cols-2">{rules.map(([title, text]) => <section key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black text-slate-950">{title}</h2><p className="mt-3 text-sm leading-7 text-slate-600">{text}</p></section>)}</div></PublicPage>;
}
