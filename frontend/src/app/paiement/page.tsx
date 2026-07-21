"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import PublicAuthLayout from "@/components/PublicAuthLayout";

export default function PaiementPage() {
  return (
    <PublicAuthLayout
      eyebrow="Paiement"
      title="Choisir un paiement"
      description="L'adhesion se paie pendant l'inscription. Les membres actifs paient leurs cotisations depuis leur espace."
      variant="process"
      footerLinks={[{ href: "/", label: "Accueil" }]}
    >
        <div className="grid gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-base font-bold">Nouvelle adhesion</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Inscription puis paiement des frais d'adhesion de 10 000 FCFA.</p>
            <Link href="/register" className="mt-3 block">
              <Button type="button" className="w-full">Devenir membre</Button>
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-base font-bold">Cotisation membre actif</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Connectez-vous puis payez vos cotisations mensuelles.</p>
            <Link href="/cotisations/paiement" className="mt-3 block">
              <Button type="button" variant="secondary" className="w-full">Payer une cotisation</Button>
            </Link>
          </div>
        </div>
    </PublicAuthLayout>
  );
}
