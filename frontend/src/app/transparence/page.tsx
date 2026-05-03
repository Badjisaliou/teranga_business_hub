"use client";

import { useEffect, useState } from "react";
import { apiRequest, getAuthToken } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { useStatusGuard } from "@/lib/use-status-guard";
import MemberPageShell, { MemberEmptyState, MemberMessage } from "@/components/MemberPageShell";

type TransparenceItem = {
  matricule: string;
  mois: number;
  annee: number;
  montant_paye: number;
  statut: string;
  date_mise_a_jour: string;
};

type TransparenceResponse = {
  data: TransparenceItem[];
  paiements_par_mois?: PaiementsParMoisItem[];
};

type TransparencePaiement = {
  matricule: string;
  reference: string;
  montant: number;
  methode_paiement: string;
  statut: string;
  date_paiement: string | null;
  created_at: string | null;
};

type PaiementsParMoisItem = {
  key: string;
  mois: number;
  annee: number;
  total_montant: number;
  nombre_paiements: number;
  paiements: TransparencePaiement[];
};

const moisLabels = ["", "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];

export default function TransparencePage() {
  const { ready } = useStatusGuard({ allowedStatuts: ["actif"] });
  const [data, setData] = useState<TransparenceItem[]>([]);
  const [groupedPaiements, setGroupedPaiements] = useState<PaiementsParMoisItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) {
      return;
    }

    async function load() {
      const token = getAuthToken();
      if (!token) {
        setError("Token absent. Connectez-vous d'abord.");
        setLoading(false);
        return;
      }

      try {
        const result = await apiRequest<TransparenceResponse>("/api/cotisations/transparence", { method: "GET" }, token);
        setData(result.data ?? []);
        setGroupedPaiements(result.paiements_par_mois ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [ready]);

  if (!ready) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <MemberPageShell
      eyebrow="Transparence"
      title="Transparence des cotisations"
      description="Accedez a une vue globale des paiements regroupes par periode, avec des informations non sensibles et faciles a consulter."
    >
      <p className="text-sm text-slate-600">
        Vue globale limitee aux informations non sensibles: matricule, periode, montant paye, statut.
      </p>

      {loading ? <MemberEmptyState>Chargement...</MemberEmptyState> : null}
      {error ? <MemberMessage tone="error">{error}</MemberMessage> : null}
      {!loading && !error && data.length === 0 ? <MemberEmptyState>Aucune donnee disponible.</MemberEmptyState> : null}

      {groupedPaiements.length > 0 ? (
        <div className="space-y-4">
          {groupedPaiements.map((group) => (
            <details key={group.key} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/90 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-lg font-bold text-slate-950">
                    {moisLabels[group.mois] ?? `Mois ${group.mois}`} {group.annee}
                  </p>
                  <p className="text-sm text-slate-600">
                    {group.nombre_paiements} paiement(s) - total {group.total_montant} FCFA
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">Afficher</span>
              </summary>

              <div className="border-t border-slate-200 p-4">
                <ul className="grid gap-3 lg:grid-cols-2">
                  {group.paiements.map((paiement, idx) => (
                    <li key={`${group.key}-${paiement.reference}-${idx}`} className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-950">{paiement.matricule}</p>
                        <Badge variant={paiement.statut === "succes" ? "success" : "warning"}>{paiement.statut}</Badge>
                      </div>
                      <p className="mt-2">Reference: {paiement.reference}</p>
                      <p>Montant: {paiement.montant} FCFA</p>
                      <p>Methode: {paiement.methode_paiement}</p>
                      <p>
                        Date:{" "}
                        {paiement.date_paiement
                          ? new Date(paiement.date_paiement).toLocaleString()
                          : paiement.created_at
                            ? new Date(paiement.created_at).toLocaleString()
                            : "-"}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      ) : null}

      {groupedPaiements.length === 0 && data.length > 0 ? (
        <Card className="rounded-[1.75rem] border-white/70 bg-white/90 p-6">
          <p className="text-sm text-slate-600">Aucun paiement de cotisation detaille n&apos;est disponible pour le moment.</p>
        </Card>
      ) : null}
    </MemberPageShell>
  );
}
