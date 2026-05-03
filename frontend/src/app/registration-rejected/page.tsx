"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import PublicAuthLayout from "@/components/PublicAuthLayout";

export default function RegistrationRejectedPage() {
  return (
    <PublicAuthLayout
      eyebrow="Statut compte"
      title="Votre inscription n'a pas ete acceptee"
      description="Merci de contacter la structure TERANGA BUSINESS HUB pour obtenir plus d'informations sur votre dossier."
      imageSrc="/hero-flyer-2.jpeg"
      imageAlt="Visuel d'accompagnement Teranga Business Hub"
      accent="red"
      points={[
        "La demande n'a pas ete validee a cette etape.",
        "L'administration peut vous donner les details necessaires.",
        "L'ecran conserve la meme signature visuelle que l'accueil.",
      ]}
      footerLinks={[{ href: "/", label: "Retour a l'accueil" }]}
    >
      <h2 className="text-3xl font-bold text-slate-950">Inscription non acceptee</h2>
      <p className="mt-3 text-base leading-8 text-slate-600">
        Votre inscription n&apos;a pas ete acceptee. Merci de contacter la structure Teranga Business Hub pour plus
        d&apos;informations.
      </p>
      <div className="mt-8">
        <Link href="/">
          <Button className="rounded-2xl px-5 py-3">Retour a l&apos;accueil</Button>
        </Link>
      </div>
    </PublicAuthLayout>
  );
}
