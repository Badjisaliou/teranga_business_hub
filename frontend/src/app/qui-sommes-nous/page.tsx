import PublicPage from "@/components/PublicPage";

const pillars = [
  ["Mission", "Faciliter l’accès des entrepreneurs à un accompagnement structuré et à un financement solidaire sous conditions."],
  ["Vision", "Construire un écosystème entrepreneurial solidaire qui transforme les contributions de la communauté en projets viables et durables."],
  ["Méthode", "Associer cotisations, étude manuelle des projets, formation, mentorat et suivi après financement."],
  ["Valeurs", "Teranga, intégrité, solidarité, innovation, transparence et redevabilité."],
];

export default function AboutPage() {
  return <PublicPage eyebrow="Qui sommes-nous ?" title="Une communauté au service des entrepreneurs." description="Teranga Business Hub réunit des membres autour d’un fonds solidaire, d’un accompagnement humain et d’une plateforme simple pour suivre l’adhésion et les cotisations."><div className="grid gap-5 md:grid-cols-2">{pillars.map(([title, text]) => <article key={title} className="rounded-[1.75rem] border border-slate-200 p-6"><h2 className="text-2xl font-black text-[color:var(--tbh-navy)]">{title}</h2><p className="mt-3 leading-8 text-slate-600">{text}</p></article>)}</div></PublicPage>;
}
