"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import PublicAuthLayout from "@/components/PublicAuthLayout";

export default function PaiementAnnulePage() {
  return (
    <PublicAuthLayout
      eyebrow="Paiement"
      title="Paiement annule"
      description="Le paiement n'a pas ete finalise sur DexPay."
      variant="process"
      footerLinks={[{ href: "/", label: "Accueil" }]}
    >
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/register">
            <Button type="button" className="w-full">Reprendre l'adhesion</Button>
          </Link>
          <Link href="/cotisations/paiement">
            <Button type="button" variant="secondary" className="w-full">Payer une cotisation</Button>
          </Link>
        </div>
    </PublicAuthLayout>
  );
}
