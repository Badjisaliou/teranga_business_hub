import PublicPage from "@/components/PublicPage";
import { organization } from "@/lib/institution";

const terms = [
  ["Accès", "L’inscription est réservée aux personnes âgées d’au moins 18 ans. Les informations fournies doivent être exactes, complètes et à jour."],
  ["Compte personnel", "Le compte, le matricule, le PIN et la Carte SIRA sont personnels et non transférables. Le membre protège ses accès et signale rapidement toute utilisation suspecte."],
  ["Adhésion", "L’adhésion annuelle de 10 000 FCFA inclut la Carte SIRA valable douze mois. Son expiration suspend les avantages réservés jusqu’au renouvellement."],
  ["Cotisations", "Le membre choisit 5 000, 10 000 ou 20 000 FCFA par mois. Il peut demander une augmentation, sans diminution ; le nouveau montant s’applique le mois suivant sans rétroactivité. En attendant l’automatisation, la demande est traitée manuellement par TBH."],
  ["Paiements", "Les paiements sont traités via DexPay et les canaux disponibles. Seules les opérations confirmées sont comptabilisées. Toute erreur ou opération non reconnue doit être signalée au support."],
  ["Financement", "L’adhésion, la Carte SIRA, les cotisations et l’ancienneté ne créent aucun droit automatique. Le volet de financement remboursable reste conditionné à l’agrément requis, à l’étude du comité et à un contrat particulier signé."],
  ["Avertissement et suspension", "Un manquement ordinaire donne lieu à un avertissement et à quinze jours pour régulariser. Une suspension temporaire est limitée à un mois. Les urgences de sécurité peuvent justifier une mesure provisoire immédiate."],
  ["Exclusion et recours", "Une exclusion ordinaire ne peut être envisagée qu’après cinq avertissements sur douze mois et un examen contradictoire. Le recours interne est possible sous trente jours et suspend les effets définitifs, hors mesures de sécurité nécessaires."],
  ["Réclamations", `Écrivez à ${organization.emails.reclamation}. Accusé de réception sous cinq jours ouvrés, réponse sous quinze jours calendaires, avec prolongation exceptionnelle motivée jusqu’à trente jours.`],
  ["Litiges", "Une solution amiable est recherchée en priorité, puis une médiation facultative peut être acceptée. À défaut, les juridictions compétentes de Dakar peuvent être saisies sous réserve des règles impératives."],
];

export default function TermsPage() {
  return <PublicPage eyebrow="Conditions" title="Conditions d’utilisation" description="Règles essentielles applicables au site, au compte membre et aux services numériques."><p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">Ces conditions intègrent les décisions actuellement confirmées et seront complétées après validation juridique et réglementaire.</p><div className="mt-7 grid gap-4 md:grid-cols-2">{terms.map(([title, text]) => <section key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black text-slate-950">{title}</h2><p className="mt-3 text-sm leading-7 text-slate-600">{text}</p></section>)}</div></PublicPage>;
}
