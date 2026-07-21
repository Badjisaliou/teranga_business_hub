import Image from "next/image";
import Link from "next/link";
import SocialIcon from "@/components/SocialIcon";
import { organization, publicSocialLinks } from "@/lib/institution";
import { getSupportHelpHref, supportWhatsAppNumber } from "@/lib/support";

const discover = [["/qui-sommes-nous", "Qui sommes-nous ?"], ["/comment-ca-marche", "Comment ça marche ?"], ["/formules", "Formules"], ["/accompagnement", "Accompagnement"], ["/equipe", "Notre équipe"]];
const useful = [["/candidature", "Préparer sa candidature"], ["/formations", "Formations"], ["/gouvernance", "Gouvernance"], ["/faq", "FAQ"], ["/contact", "Contact"]];
const legal = [["/mentions-legales", "Mentions légales"], ["/politique-confidentialite", "Politique de confidentialité"], ["/conditions-utilisation", "Conditions d’utilisation"], ["/reglement-programme", "Règlement du programme"]];

export default function AppFooter() {
  return <footer className="mt-auto bg-[color:var(--tbh-navy)] text-white">
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
      <div><Link href="/" className="flex items-center gap-3"><Image src="/tbh-logo.png" alt={`Logo ${organization.name}`} width={56} height={56} className="rounded-xl bg-white p-1" /><div><p className="font-black">{organization.name}</p><p className="text-xs text-blue-100">Finance solidaire & accompagnement</p></div></Link><p className="mt-4 text-sm leading-7 text-blue-50">Une communauté au service des entrepreneurs, de la structuration des projets et du financement solidaire sous conditions.</p></div>
      <FooterLinks title="Découvrir" links={discover} />
      <FooterLinks title="Ressources" links={useful} />
      <div><h2 className="text-sm font-black uppercase tracking-[.16em] text-blue-100">Contact & documents</h2><nav className="mt-4 grid gap-2">{legal.map(([href, label]) => <Link key={href} href={href} className="text-sm text-blue-50">{label}</Link>)}</nav><a href={getSupportHelpHref()} className="mt-4 inline-flex rounded-full border border-emerald-200/30 bg-emerald-500/15 px-4 py-2 text-sm font-bold">Aide WhatsApp{supportWhatsAppNumber ? ` · ${supportWhatsAppNumber}` : ""}</a>{publicSocialLinks.length > 0 ? <div className="mt-5"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-100">Suivez-nous</p><div className="flex flex-wrap gap-2">{publicSocialLinks.map((link) => <a key={link.network} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`Suivre ${organization.name} sur ${link.label}`} title={link.label} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition hover:border-white/50 hover:bg-white/10"><SocialIcon network={link.network} /></a>)}</div></div> : null}</div>
    </div>
    <div className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-blue-100 sm:flex-row sm:justify-between sm:px-6 lg:px-8"><p>© {organization.name}. Tous droits réservés.</p><p>Site public et espace membre de finance solidaire.</p></div></div>
  </footer>;
}

function FooterLinks({ title, links }: { title: string; links: string[][] }) {
  return <div><h2 className="text-sm font-black uppercase tracking-[.16em] text-blue-100">{title}</h2><nav className="mt-4 grid gap-2">{links.map(([href, label]) => <Link key={href} href={href} className="text-sm text-blue-50 hover:text-white">{label}</Link>)}</nav></div>;
}
