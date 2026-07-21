"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import PublicAuthLayout from "@/components/PublicAuthLayout";

export default function AccountBlockedPage() {
  return (
    <PublicAuthLayout
      eyebrow="Statut membre"
      title="Votre espace membre est actuellement bloque"
      description="Pour reprendre l'acces a votre espace membre, merci de contacter la structure TERANGA BUSINESS HUB."
      imageSrc="/hero-flyer-2.jpeg"
      imageAlt="Visuel d'information Teranga Business Hub"
      accent="red"
      points={[
        "Le blocage peut etre lie a votre situation administrative ou de paiement.",
        "L'equipe TERANGA BUSINESS HUB pourra vous guider sur la suite.",
        "La page reste harmonisee avec l'identite du site.",
      ]}
      footerLinks={[{ href: "/", label: "Retour a l'accueil" }]}
    >
      <h2 className="text-3xl font-bold text-slate-950">Espace membre bloque</h2>
      <p className="mt-3 text-base leading-8 text-slate-600">
        Votre espace membre est actuellement bloque. Merci de contacter la structure Teranga Business Hub pour plus
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
