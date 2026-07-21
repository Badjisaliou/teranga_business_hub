import PublicPage from "@/components/PublicPage";
import { organization } from "@/lib/institution";

const documents = ["Pièce d’identité valide", "Business Plan complet", "Étude de marché", "Prévisions financières et trésorerie", "Justificatif de domicile de moins de trois mois", "Photo d’identité", "NINEA, RCCM et autorisations lorsque l’activité ou l’étape du dossier l’exige"];

export default function ApplicationPage() {
  return <PublicPage eyebrow="Préparer sa candidature" title="Un dossier clair facilite une étude sérieuse." description="Les candidatures au financement sont reçues et étudiées manuellement.">
    <div className="grid gap-8 lg:grid-cols-2"><section><h2 className="text-2xl font-black">Pièces à préparer</h2><ul className="mt-5 space-y-3">{documents.map((document) => <li key={document} className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">✓ {document}</li>)}</ul></section><section className="rounded-[1.75rem] bg-slate-50 p-6"><h2 className="text-2xl font-black">Votre projet n’est pas prêt ?</h2><p className="mt-4 leading-8 text-slate-600">TBH met à disposition des modèles de Business Plan et de prévisions financières. Le dossier peut être préparé sur support physique ou électronique.</p><p className="mt-4 leading-8 text-slate-600">Une activité non encore formalisée peut être accompagnée ; les documents réglementaires nécessaires devront toutefois être obtenus avant tout éventuel décaissement.</p><p className="mt-5 text-sm font-bold text-[color:var(--tbh-red)]">La réception et les demandes de compléments sont suivies manuellement par l’assistante de direction.</p></section></div>
    <a href={`mailto:${organization.emails.candidature}`} className="mt-8 inline-flex rounded-full bg-[color:var(--tbh-red)] px-6 py-3 font-bold text-white">Écrire à {organization.emails.candidature}</a>
  </PublicPage>;
}
