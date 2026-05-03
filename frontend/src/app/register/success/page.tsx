import Link from "next/link";
import Button from "@/components/ui/Button";
import PublicAuthLayout from "@/components/PublicAuthLayout";

export default function RegisterSuccessPage() {
  return (
    <PublicAuthLayout
      eyebrow="Inscription"
      title="Votre demande a bien ete enregistree"
      description="Votre dossier est maintenant en attente de traitement par l'administration de TERANGA BUSINESS HUB."
      imageSrc="/hero-flyer-1.jpeg"
      imageAlt="Visuel de confirmation Teranga Business Hub"
      points={[
        "Vos informations ont ete recues avec succes.",
        "Vous serez informe lorsque votre inscription sera validee ou invalidee.",
        "Merci de patienter pendant l'etude de votre dossier.",
      ]}
      footerLinks={[
        { href: "/", label: "Retour a l'accueil" },
        { href: "/login", label: "Connexion" },
      ]}
    >
      <h2 className="text-3xl font-bold text-slate-950">Inscription enregistree</h2>
      <p className="mt-3 text-base leading-8 text-slate-600">
        Vos informations ont ete enregistrees avec succes. Vous recevrez un message pour vous informer si votre
        inscription est validee ou invalidee.
      </p>
      <div className="mt-8">
        <Link href="/">
          <Button className="rounded-2xl px-5 py-3">Retour a l&apos;accueil</Button>
        </Link>
      </div>
    </PublicAuthLayout>
  );
}
