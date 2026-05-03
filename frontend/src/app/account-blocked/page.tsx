"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import PublicAuthLayout from "@/components/PublicAuthLayout";

export default function AccountBlockedPage() {
  return (
    <PublicAuthLayout
      eyebrow="Statut compte"
      title="Votre compte est actuellement bloqué"
      description="Pour reprendre l'accès à votre espace membre, merci de contacter la structure TERANGA BUSINESS HUB."
      imageSrc="/hero-flyer-2.jpeg"
      imageAlt="Visuel d'information Teranga Business Hub"
      accent="red"
      points={[
        "Le blocage peut être lié à votre situation administrative ou de paiement.",
        "L'équipe TERANGA BUSINESS HUB pourra vous guider sur la suite.",
        "La page reste harmonisée avec la nouvelle identité du site.",
      ]}
      footerLinks={[{ href: "/", label: "Retour à l'accueil" }]}
    >
      <h2 className="text-3xl font-bold text-slate-950">Compte bloqué</h2>
      <p className="mt-3 text-base leading-8 text-slate-600">
        Votre compte est actuellement bloqué. Merci de contacter la structure Teranga Business Hub pour plus
        d&apos;informations.
      </p>
      <div className="mt-8">
        <Link href="/">
          <Button className="rounded-2xl px-5 py-3">Retour à l&apos;accueil</Button>
        </Link>
      </div>
    </PublicAuthLayout>
  );
}
