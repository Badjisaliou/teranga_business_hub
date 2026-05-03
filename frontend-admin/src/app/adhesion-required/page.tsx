"use client";

import Link from "next/link";
import { useAdminGuard } from "@/lib/use-admin-guard";
import Card from "@/components/ui/Card";

export default function AdhesionRequiredPage() {
  const { ready } = useAdminGuard({
    requireAdminRole: false,
    allowedStatuts: ["attente_adhesion"],
  });

  if (!ready) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen bg-white px-6 py-16 text-slate-900">
      <Card className="mx-auto w-full max-w-2xl border-amber-700/40 p-8">
        <h1 className="mb-4 text-2xl font-semibold text-amber-200">Adhesion requise</h1>
        <p className="text-slate-600">
          Votre compte est en attente d&apos;adhesion. Merci de regler 10 000 FCFA dans l&apos;application membre pour
          activer les services.
        </p>
        <div className="mt-6">
          <Link href="/login" className="inline-flex rounded-md bg-[color:var(--tbh-red)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
            Retour connexion
          </Link>
        </div>
      </Card>
    </div>
  );
}
