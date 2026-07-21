"use client";

import Link from "next/link";
import { useAdminGuard } from "@/lib/use-admin-guard";
import Card from "@/components/ui/Card";
import AdminGuardLoading from "@/components/AdminGuardLoading";

export default function AccountBlockedPage() {
  const { ready } = useAdminGuard({
    requireAdminRole: false,
    allowedStatuts: ["bloque"],
  });

  if (!ready) {
    return <AdminGuardLoading />;
  }

  return (
    <div className="min-h-screen bg-white px-6 py-16 text-slate-900">
      <Card className="mx-auto w-full max-w-2xl border-rose-700/40 p-8">
        <h1 className="mb-4 text-2xl font-semibold text-rose-300">Espace administrateur bloque</h1>
        <p className="text-slate-600">
          Votre espace administrateur est bloque. Merci de contacter la structure Teranga Business Hub pour plus d&apos;informations.
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
