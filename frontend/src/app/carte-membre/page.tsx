import Image from "next/image";
import PublicPage from "@/components/PublicPage";
import { formatFcfa, organization } from "@/lib/institution";

const benefits = [
  "Accès à l’espace membre et aux ressources de la structure",
  "Identification par matricule et QR code",
  "Accès au programme de financement solidaire, sous réserve des conditions applicables",
  "Trois formations incluses par année d’adhésion",
  "Certification à la fin de chaque formation suivie",
  "Accès au réseau, aux activités et aux partenaires disponibles",
];

export default function MemberCardPublicPage() {
  const card = organization.card;
  return (
    <PublicPage
      eyebrow="Carte membre"
      title={`${card.name} — ${card.expandedName}`}
      description={`La carte est automatiquement incluse dans l’adhésion annuelle de ${formatFcfa(card.annualFee)} et reste valable ${card.validityMonths} mois.`}
    >
      <figure className="mb-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-xl">
        <Image src="/tbh/carte-sira-reference.jpeg" alt="Présentation officielle de la Carte virtuelle SIRA de Teranga Business Hub" width={1280} height={853} priority className="h-auto w-full rounded-[1.5rem]" />
        <figcaption className="px-3 pb-2 pt-4 text-center text-sm font-semibold text-slate-600">Présentation visuelle de la Carte SIRA</figcaption>
      </figure>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit) => <article key={benefit} className="rounded-2xl border border-slate-200 p-5 font-bold text-slate-800">✓ {benefit}</article>)}
      </div>
      <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-xl font-black text-slate-950">Validité, renouvellement et certification</h2>
        <p className="mt-3 leading-7 text-slate-700">Un an après l’adhésion, le renouvellement coûte {formatFcfa(card.annualFee)}. À l’expiration de la carte, l’accès aux ressources et avantages de la structure est suspendu jusqu’au renouvellement.</p>
        <p className="mt-3 leading-7 text-slate-700">Une certification est délivrée à la fin de chaque formation suivie. Le paiement de la Carte SIRA et sa validité constituent une condition nécessaire.</p>
      </section>
    </PublicPage>
  );
}
