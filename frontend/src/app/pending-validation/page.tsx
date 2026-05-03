"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import PublicAuthLayout from "@/components/PublicAuthLayout";

export default function PendingValidationPage() {
  return (
    <PublicAuthLayout
      eyebrow="Statut compte"
      title="Votre inscription est en attente"
      description="Votre dossier a bien été soumis et attend maintenant la validation par un administrateur."
      imageSrc="/hero-flyer-1.jpeg"
      imageAlt="Visuel de suivi Teranga Business Hub"
      points={[
        "Le compte reste en attente tant que la validation administrative n'est pas terminée.",
        "Vous serez informé dès que votre dossier évolue.",
        "L'écran suit la nouvelle présentation harmonisée du site.",
      ]}
      footerLinks={[{ href: "/", label: "Retour à l'accueil" }]}
    >
      <h2 className="text-3xl font-bold text-slate-950">Inscription en attente</h2>
      <p className="mt-3 text-base leading-8 text-slate-600">
        Votre compte est en attente de validation par un administrateur. Vous recevrez un message quand votre
        inscription sera validée ou rejetée.
      </p>
      <div className="mt-8">
        <Link href="/">
          <Button className="rounded-2xl px-5 py-3">Retour à l&apos;accueil</Button>
        </Link>
      </div>
    </PublicAuthLayout>
  );
}
