import PublicPage from "@/components/PublicPage";
import { formatFcfa, organization } from "@/lib/institution";

const { legal, emails } = organization;

export default function LegalNoticePage() {
  return (
    <PublicPage
      eyebrow="Informations légales"
      title="Mentions légales"
      description="Informations officielles relatives à l’éditeur du site Teranga Business Hub."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <LegalSection title="Éditeur du site">
          <LegalRow label="Raison sociale" value={legal.legalName} />
          <LegalRow label="Nom commercial" value={legal.tradeName} />
          <LegalRow label="Forme juridique" value={legal.legalForm} />
          <LegalRow label="Capital social" value={formatFcfa(legal.shareCapital)} />
          <LegalRow label="Pays d’immatriculation" value={legal.country} />
          <LegalRow label="RCCM" value={legal.rccm} />
          <LegalRow label="NINEA" value={legal.ninea} />
        </LegalSection>

        <LegalSection title="Direction et siège social">
          <LegalRow label="Représentant légal" value={`${legal.representative}, ${legal.representativeRole}`} />
          <LegalRow label="Directeur de la publication" value={legal.publicationDirector} />
          <LegalRow label="Adresse" value={legal.address} />
          <LegalRow label="Téléphone" value={organization.phone} />
          <LegalRow label="Adresse officielle" value={emails.direction} href={`mailto:${emails.direction}`} />
        </LegalSection>

        <LegalSection title="Contacts réglementaires">
          <LegalRow label="Données personnelles" value={emails.donnees} href={`mailto:${emails.donnees}`} />
          <LegalRow label="Réclamations" value={emails.reclamation} href={`mailto:${emails.reclamation}`} />
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Toute demande doit préciser l’identité du demandeur, ses coordonnées et l’objet de sa démarche afin de permettre son traitement.
          </p>
        </LegalSection>

        <LegalSection title="Horaires d’ouverture">
          <ul className="space-y-2 text-sm text-slate-700">
            {legal.openingHours.map((hours) => <li key={hours}>{hours}</li>)}
          </ul>
        </LegalSection>

        <LegalSection title="Hébergement du site public">
          <LegalRow label="Prestataire" value="Vercel Inc." />
          <LegalRow label="Adresse" value="440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis" />
          <LegalRow label="Site" value="vercel.com" href="https://vercel.com" />
          <p className="mt-4 text-sm leading-7 text-slate-600">Vercel assure l’hébergement et la diffusion de l’interface publique du site.</p>
        </LegalSection>

        <LegalSection title="Hébergement de l’application et des données">
          <LegalRow label="Prestataire" value="Railway Corporation" />
          <LegalRow label="Adresse" value="548 Market St PMB 68956, San Francisco, CA 94104, États-Unis" />
          <LegalRow label="Site" value="railway.com" href="https://railway.com" />
          <p className="mt-4 text-sm leading-7 text-slate-600">Railway assure l’hébergement technique de l’API et de la base de données selon la configuration en production.</p>
        </LegalSection>
      </div>
    </PublicPage>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="mb-5 text-xl font-black text-slate-950">{title}</h2>{children}</section>;
}

function LegalRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return <p className="mb-3 text-sm leading-6 text-slate-700"><span className="font-bold text-slate-950">{label} :</span>{" "}{href ? <a className="text-blue-700 underline" href={href}>{value}</a> : value}</p>;
}
