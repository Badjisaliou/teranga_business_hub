"use client";

import Link from "next/link";
import { useAdminGuard } from "@/lib/use-admin-guard";
import Card from "@/components/ui/Card";

export default function RegistrationRejectedPage() {
  const { ready } = useAdminGuard({
    requireAdminRole: false,
    allowedStatuts: ["rejete"],
  });

  if (!ready) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen bg-white px-6 py-16 text-slate-900">
      <Card className="mx-auto w-full max-w-2xl border-rose-700/40 p-8">
        <h1 className="mb-4 text-2xl font-semibold text-rose-300">Inscription non acceptee</h1>
        <p className="text-slate-600">
          Votre inscription n&apos;a pas ete acceptee. Merci de contacter la structure Teranga Business Hub.
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
