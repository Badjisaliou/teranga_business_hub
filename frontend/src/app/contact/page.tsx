import PublicPage from "@/components/PublicPage";
import SocialIcon from "@/components/SocialIcon";
import { organization, publicSocialLinks } from "@/lib/institution";
import { getSupportHelpHref } from "@/lib/support";

const contacts = [
  ["Demandes générales", organization.emails.contact, "Informations sur la structure et orientation générale."],
  ["Direction", organization.emails.direction, "Communications officielles et demandes adressées à la direction."],
  ["Assistance membres", organization.emails.support, "Compte, PIN, carte, cotisations et paiements."],
  ["Candidatures", organization.emails.candidature, "Réception manuelle des dossiers de projet."],
  ["Accompagnement", organization.emails.accompagnement, "Idées et projets qui ne sont pas encore structurés."],
  ["Formations", organization.emails.formation, "Sessions, inscriptions et certifications."],
  ["Partenariats", organization.emails.partenariat, "Investisseurs, institutions et partenaires."],
  ["Données personnelles", organization.emails.donnees, "Accès, rectification et autres droits sur les données."],
  ["Réclamations", organization.emails.reclamation, "Contestations et réclamations formelles."],
];

export default function ContactPage() {
  return <PublicPage eyebrow="Contact" title="Échangez avec Teranga Business Hub." description="Choisissez l’adresse correspondant à votre demande afin qu’elle soit orientée vers la bonne équipe.">
    <div className="mb-8 grid gap-5 md:grid-cols-2"><a href={getSupportHelpHref("Bonjour, je souhaite échanger avec Teranga Business Hub.")} className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6"><h2 className="text-2xl font-black text-emerald-900">WhatsApp</h2><p className="mt-3 text-sm text-emerald-800">Le moyen le plus direct pour une première orientation.</p></a><a href={`mailto:${organization.emails.contact}`} className="rounded-[1.75rem] border border-slate-200 p-6"><h2 className="text-2xl font-black">Contact général</h2><p className="mt-3 text-slate-600">{organization.emails.contact}</p></a></div>
    <section><h2 className="text-2xl font-black">Adresses par service</h2><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{contacts.map(([title, email, description]) => <a key={email} href={`mailto:${email}`} className="rounded-2xl border border-slate-200 p-5 hover:border-[color:var(--tbh-red)]"><h3 className="font-black text-slate-950">{title}</h3><p className="mt-2 break-all text-sm font-bold text-[color:var(--tbh-red)]">{email}</p><p className="mt-3 text-sm leading-6 text-slate-600">{description}</p></a>)}</div></section>
    <section className="mt-10 rounded-[1.75rem] bg-[color:var(--tbh-navy)] p-6 text-white sm:p-8"><h2 className="text-2xl font-black">Retrouvez-nous sur les réseaux sociaux</h2><p className="mt-2 text-blue-100">Suivez nos actualités, formations et actions en faveur des entrepreneurs.</p><div className="mt-5 flex flex-wrap gap-3">{publicSocialLinks.map((link) => <a key={link.network} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"><SocialIcon network={link.network} /><span>{link.label}</span></a>)}</div></section>
  </PublicPage>;
}
