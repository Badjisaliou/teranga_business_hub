import PublicPage from "@/components/PublicPage";
import { organization } from "@/lib/institution";

const sections = [
  ["Responsable du traitement", `${organization.legal.legalName}, ${organization.legal.legalForm}, siège à ${organization.legal.address}. Contact : ${organization.emails.donnees}.`],
  ["Données traitées", "Identité, date de naissance, coordonnées, matricule, adhésion, Carte SIRA, authentification, formule, paiements, cotisations, demandes de support et, lors d’une candidature, informations et documents relatifs au projet."],
  ["Finalités", "Créer et sécuriser le compte, gérer l’adhésion et la Carte SIRA, suivre les cotisations et paiements, traiter les demandes, accompagner les projets, étudier les candidatures et prévenir la fraude."],
  ["Destinataires", "L’accès est limité aux fonctions habilitées de la direction, de l’administration et finance, des opérations, du support et de la technique. Les prestataires nécessaires incluent DexPay, Vercel et Railway selon leurs rôles respectifs."],
  ["Conservation", "Les données ordinaires sont conservées pendant la relation puis un an après le départ. Un dossier et un Business Plan refusés sont supprimés après trois mois ; une fiche minimale de traçabilité est conservée un an. Certaines pièces peuvent être archivées plus longtemps lorsqu’une obligation légale l’impose."],
  ["Confidentialité des projets", "Les Business Plans et pièces de candidature ne sont pas rendus publics. Ils sont accessibles uniquement aux personnes habilitées pour la réception, l’accompagnement, l’évaluation, le contrôle ou la défense des droits."],
  ["Communications", "Les messages indispensables au compte ou au service peuvent être envoyés sans consentement commercial. Les actualités et offres nécessitent un accord séparé, facultatif et révocable."],
  ["Mesure d’audience", "Seul Vercel Analytics est retenu. Sa configuration doit respecter les exigences d’information et, lorsqu’il est requis, de consentement. Google Analytics et les outils publicitaires ne sont pas utilisés."],
  ["Vos droits", `Vous pouvez demander l’accès, la rectification, la suppression ou exercer votre droit d’opposition dans les conditions légales en écrivant à ${organization.emails.donnees}. Une réclamation peut être adressée à ${organization.emails.reclamation}.`],
];

export default function PrivacyPolicyPage() {
  return <PublicPage eyebrow="Protection des données" title="Politique de confidentialité" description="Principes appliqués aux données des visiteurs, candidats, membres et entrepreneurs."><Notice /> <div className="mt-7 grid gap-4 md:grid-cols-2">{sections.map(([title, text]) => <section key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black text-slate-950">{title}</h2><p className="mt-3 text-sm leading-7 text-slate-600">{text}</p></section>)}</div></PublicPage>;
}

function Notice() { return <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">Cette version présente les règles actuellement confirmées. Elle reste susceptible d’être complétée après les formalités auprès de la CDP et la validation juridique finale.</p>; }
