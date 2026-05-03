"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest, clearAdminSession, getAdminToken } from "@/lib/api";
import { useAdminGuard } from "@/lib/use-admin-guard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type AdminDashboardResponse = {
  kpis: {
    total_utilisateurs: number;
    utilisateurs_actifs: number;
    utilisateurs_bloques: number;
    paiements_en_attente: number;
    paiements_succes: number;
    total_encaisse: number;
    cotisations_non_soldees: number;
    membres_a_risque_blocage: number;
  };
  repartition_par_methode: Array<{ methode_paiement: string; total: number }>;
  actions_admin_recentes: Array<{ id: number; action: string; description: string | null }>;
  membres_a_bloquer_defaut_paiement: Array<{
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string | null;
    mois_non_soldes: number;
    details: string[];
  }>;
};

export default function DashboardPage() {
  const { ready } = useAdminGuard({ requireAdminRole: true, allowedStatuts: ["actif"] });
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!ready) {
      return;
    }

    const token = getAdminToken();
    if (!token) {
      return;
    }

    const result = await apiRequest<AdminDashboardResponse>("/api/admin/dashboard", { method: "GET" }, token);
    setData(result);
  }, [ready]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    async function load() {
      try {
        await loadDashboard();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    }

    void load();
  }, [loadDashboard, ready]);

  if (!ready) {
    return <div className="min-h-screen bg-white" />;
  }

  async function blockForPaymentDefault(userId: number) {
    const token = getAdminToken();
    if (!token) {
      setError("Session admin invalide.");
      return;
    }

    setBusyUserId(userId);
    setError(null);
    try {
      await apiRequest(
        "/api/admin/block-user",
        {
          method: "POST",
          body: JSON.stringify({
            user_id: userId,
            description: "Blocage pour defaut de paiement (2 mois non soldes).",
          }),
        },
        token,
      );
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Blocage impossible");
    } finally {
      setBusyUserId(null);
    }
  }

  async function exportPaiementsCsv() {
    const token = getAdminToken();
    if (!token) {
      setError("Session admin invalide.");
      return;
    }

    setExporting(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"}/api/admin/exports/paiements-csv`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Export CSV impossible.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename=\"([^\"]+)\"/i);
      const fileName = match?.[1] ?? `paiements_export_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export CSV impossible.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <div className="flex items-center gap-2">
            <Link href="/users" className="rounded-lg bg-[color:var(--tbh-red)] px-3 py-2 text-sm font-semibold text-white">
              Gerer utilisateurs
            </Link>
            <Link href="/settings" className="rounded-lg border border-[color:var(--tbh-border)] px-3 py-2 text-sm">
              Parametres metier
            </Link>
            <Button type="button" variant="secondary" onClick={() => void exportPaiementsCsv()} disabled={exporting}>
              {exporting ? "Export..." : "Exporter CSV"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                clearAdminSession();
                router.push("/login");
              }}
            >
              Deconnexion
            </Button>
          </div>
        </div>

        {error ? <p className="text-red-400">{error}</p> : null}
        {!data ? <p className="text-slate-600">Chargement...</p> : null}

        {data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard title="Total utilisateurs" value={data.kpis.total_utilisateurs} />
              <KpiCard title="Actifs" value={data.kpis.utilisateurs_actifs} />
              <KpiCard title="Paiements succes" value={data.kpis.paiements_succes} />
              <KpiCard title="Total encaisse" value={data.kpis.total_encaisse} />
              <KpiCard title="Membres a risque" value={data.kpis.membres_a_risque_blocage} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <h2 className="mb-3 text-lg font-semibold">Repartition par methode</h2>
                <ul className="space-y-2 text-sm text-slate-600">
                  {data.repartition_par_methode.map((item) => (
                    <li key={item.methode_paiement} className="flex justify-between">
                      <span>{item.methode_paiement}</span>
                      <span>{item.total}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <h2 className="mb-3 text-lg font-semibold">Actions admin recentes</h2>
                <ul className="space-y-2 text-sm text-slate-600">
                  {data.actions_admin_recentes.slice(0, 10).map((item) => (
                    <li key={item.id} className="rounded-lg bg-slate-800 px-3 py-2">
                      <p className="font-semibold">{item.action}</p>
                      <p>{item.description ?? "Sans description"}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <Card className="border-amber-700/50 bg-amber-950/20">
              <h2 className="mb-3 text-lg font-semibold text-amber-200">Membres a bloquer (defaut paiement)</h2>
              {data.membres_a_bloquer_defaut_paiement.length === 0 ? (
                <p className="text-sm text-slate-600">Aucun membre actif avec 2 mois non soldes ou plus.</p>
              ) : (
                <ul className="space-y-2 text-sm text-slate-700">
                  {data.membres_a_bloquer_defaut_paiement.map((item) => (
                    <li key={item.id} className="rounded-lg border border-amber-800/40 bg-white/70 p-3">
                      <p className="font-semibold">
                        {item.prenom} {item.nom} ({item.matricule})
                      </p>
                      <p className="mb-1">{item.email}</p>
                      <Badge variant="warning" className="mb-2">
                        Mois non soldes : {item.mois_non_soldes}
                      </Badge>
                      <p>Details : {item.details.join(", ")}</p>
                      <Button
                        type="button"
                        className="mt-2 bg-amber-500 text-slate-950 hover:opacity-90"
                        onClick={() => void blockForPaymentDefault(item.id)}
                        disabled={busyUserId === item.id}
                      >
                        {busyUserId === item.id ? "Blocage..." : "Bloquer pour defaut de paiement"}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <p className="text-sm text-slate-600">{title}</p>
      <p className="text-2xl font-bold text-[color:var(--tbh-red)]">{value}</p>
    </Card>
  );
}
