import Image from "next/image";
import PublicPage from "@/components/PublicPage";
import { teamMembers } from "@/lib/institution";

export default function TeamPage() {
  return (
    <PublicPage
      eyebrow="Notre équipe"
      title="L’équipe qui accompagne votre projet."
      description="Des compétences complémentaires réunies autour de la direction, des opérations, de la finance, de la technologie, de la communication et du développement commercial."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member) => (
          <article key={member.name} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="relative h-80 overflow-hidden bg-[linear-gradient(145deg,var(--tbh-navy),#173a6d)]">
              <Image src={member.photo} alt={`Portrait de ${member.name}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover object-top transition duration-500 group-hover:scale-[1.03]" />
            </div>
            <div className="p-6">
              <p className="text-xs font-black uppercase tracking-[.16em] text-[color:var(--tbh-red)]">{member.department}</p>
              <h2 className="mt-2 text-xl font-black text-slate-950">{member.name}</h2>
              <p className="mt-2 font-semibold leading-6 text-slate-600">{member.role}</p>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm leading-7 text-slate-700">Les portraits de toute l’équipe sont maintenant présentés. Les biographies seront ajoutées progressivement après réception et autorisation de publication.</p>
    </PublicPage>
  );
}
