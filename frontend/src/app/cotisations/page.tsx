"use client";

import { useEffect, useState } from "react";
import { apiRequest, getAuthToken } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useStatusGuard } from "@/lib/use-status-guard";
import MemberPageShell, { MemberEmptyState, MemberMessage } from "@/components/MemberPageShell";

type PaiementAssocie = {
  id: number;
  reference: string;
  montant: number;
  statut: string;
  methode_paiement: string;
  date_paiement: string | null;
  created_at: string | null;
};

type CotisationItem = {
  id: number;
  mois: number;
  annee: number;
  montant_paye: number;
  statut: string;
  paiements_associes: PaiementAssocie[];
};

type CotisationsResponse = {
  data: CotisationItem[];
};

const moisLabels = ["", "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];

export default function CotisationsPage() {
  const { ready } = useStatusGuard({ allowedStatuts: ["actif"] });
  const [data, setData] = useState<CotisationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDetails, setOpenDetails] = useState<Record<number, boolean>>({});

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
        const result = await apiRequest<CotisationsResponse>("/api/cotisations", { method: "GET" }, token);
        setData(result.data ?? []);
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
    <MemberPageShell eyebrow="Suivi financier" title="Mes cotisations" description="Consultez vos mois soldes, partiels ou en retard avec le detail de chaque paiement associe.">
      {loading ? <MemberEmptyState>Chargement...</MemberEmptyState> : null}
      {error ? <MemberMessage tone="error">{error}</MemberMessage> : null}
      {!loading && !error && data.length === 0 ? <MemberEmptyState>Aucune cotisation.</MemberEmptyState> : null}

      {data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((item) => {
            const detailsOpen = !!openDetails[item.id];
            const statusCardClass =
              item.statut === "solde"
                ? "border-emerald-200 bg-emerald-50/70"
                : item.statut === "partiel"
                  ? "border-amber-200 bg-amber-50/80"
                  : item.statut === "en_retard"
                    ? "border-rose-200 bg-rose-50/80"
                    : "border-slate-200 bg-white";

            return (
              <Card key={item.id} className={`rounded-[1.75rem] ${statusCardClass} p-6`}>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.annee}</p>
                  <h2 className="text-2xl font-bold text-slate-950">{moisLabels[item.mois] ?? `Mois ${item.mois}`}</h2>
                  <p className="text-sm text-slate-600">Montant paye: {item.montant_paye} FCFA</p>
                  <Badge
                    variant={item.statut === "solde" ? "success" : item.statut === "partiel" ? "warning" : item.statut === "en_retard" ? "danger" : "neutral"}
                    className="px-3 py-1"
                  >
                    {item.statut}
                  </Badge>

                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-2xl"
                      onClick={() => setOpenDetails((prev) => ({ ...prev, [item.id]: !detailsOpen }))}
                    >
                      {detailsOpen ? "Masquer detail" : "Detail"}
                    </Button>
                  </div>

                  {detailsOpen ? (
                    <div className="rounded-[1.25rem] border border-white/80 bg-white/80 p-4">
                      <p className="mb-3 text-sm font-semibold text-slate-700">Paiements associes</p>
                      {item.paiements_associes.length === 0 ? (
                        <p className="text-sm text-slate-600">Aucun paiement associe pour ce mois.</p>
                      ) : (
                        <ul className="space-y-3 text-sm text-slate-700">
                          {item.paiements_associes.map((paiement) => (
                            <li key={paiement.id} className="rounded-[1rem] border border-slate-200 bg-white p-3">
                              <p>Reference: {paiement.reference}</p>
                              <p>Montant: {paiement.montant} FCFA</p>
                              <p>Methode: {paiement.methode_paiement}</p>
                              <p>Statut: {paiement.statut}</p>
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
                      )}
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
    </MemberPageShell>
  );
}
