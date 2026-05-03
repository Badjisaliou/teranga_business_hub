"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest, getAuthToken } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useStatusGuard } from "@/lib/use-status-guard";
import MemberPageShell, { MemberEmptyState, MemberMessage } from "@/components/MemberPageShell";
import { formFieldClassName } from "@/components/PublicAuthLayout";

type PaiementItem = {
  id: number;
  reference: string;
  type: "adhesion" | "cotisation";
  montant: number;
  methode_paiement: "wave" | "orange_money";
  statut: "en_attente" | "succes" | "echoue";
  created_at: string;
};

type HistoriqueResponse = {
  data: PaiementItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export default function PaiementsHistoriquePage() {
  const { ready } = useStatusGuard({ allowedStatuts: ["actif"] });
  const [type, setType] = useState("");
  const [statut, setStatut] = useState("");
  const [methode, setMethode] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<PaiementItem[]>([]);
  const [meta, setMeta] = useState<HistoriqueResponse["meta"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (statut) params.set("statut", statut);
    if (methode) params.set("methode_paiement", methode);
    if (dateDebut) params.set("date_debut", dateDebut);
    if (dateFin) params.set("date_fin", dateFin);
    params.set("page", String(page));
    params.set("per_page", "15");
    return params.toString();
  }, [dateDebut, dateFin, methode, page, statut, type]);

  useEffect(() => {
    if (!ready) return;

    async function load() {
      const token = getAuthToken();
      if (!token) {
        setError("Token absent. Connectez-vous d'abord.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await apiRequest<HistoriqueResponse>(`/api/paiements/historique?${queryString}`, { method: "GET" }, token);
        setItems(result.data ?? []);
        setMeta(result.meta ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [queryString, ready]);

  if (!ready) return <div className="min-h-screen bg-white" />;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
  }

  return (
    <MemberPageShell
      eyebrow="Paiements"
      title="Historique des paiements"
      description="Filtrez vos transactions et consultez leur statut dans un tableau plus lisible et mieux structuré."
    >
      <form onSubmit={onSubmit}>
        <Card className="grid gap-3 rounded-[1.75rem] border-white/70 bg-white/90 p-5 sm:grid-cols-2 xl:grid-cols-6">
          <select value={type} onChange={(e) => setType(e.target.value)} className={formFieldClassName}>
            <option value="">Type (tous)</option>
            <option value="adhesion">Adhésion</option>
            <option value="cotisation">Cotisation</option>
          </select>
          <select value={statut} onChange={(e) => setStatut(e.target.value)} className={formFieldClassName}>
            <option value="">Statut (tous)</option>
            <option value="en_attente">En attente</option>
            <option value="succes">Succès</option>
            <option value="echoue">Échoué</option>
          </select>
          <select value={methode} onChange={(e) => setMethode(e.target.value)} className={formFieldClassName}>
            <option value="">Méthode (toutes)</option>
            <option value="wave">Wave</option>
            <option value="orange_money">Orange Money</option>
          </select>
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className={formFieldClassName} />
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className={formFieldClassName} />
          <Button type="submit" variant="primary" className="rounded-2xl py-3">Filtrer</Button>
        </Card>
      </form>

      {loading ? <MemberEmptyState>Chargement...</MemberEmptyState> : null}
      {error ? <MemberMessage tone="error">{error}</MemberMessage> : null}
      {!loading && !error && items.length === 0 ? <MemberEmptyState>Aucun paiement trouvé.</MemberEmptyState> : null}

      {items.length > 0 ? (
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/90 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Référence</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Montant</th>
                <th className="px-4 py-4">Méthode</th>
                <th className="px-4 py-4">Statut</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-4 py-4">{new Date(item.created_at).toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-4">{item.reference}</td>
                  <td className="px-4 py-4">{item.type}</td>
                  <td className="px-4 py-4">{item.montant} FCFA</td>
                  <td className="px-4 py-4">{item.methode_paiement === "wave" ? "Wave" : "Orange Money"}</td>
                  <td className="px-4 py-4">
                    <Badge variant={item.statut === "succes" ? "success" : item.statut === "echoue" ? "danger" : "warning"}>
                      {item.statut}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {meta && meta.last_page > 1 ? (
        <div className="flex items-center gap-3">
          <Button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={meta.current_page <= 1} variant="secondary" className="rounded-2xl">
            Précédent
          </Button>
          <p className="text-sm text-slate-600">
            Page {meta.current_page} / {meta.last_page} ({meta.total} résultats)
          </p>
          <Button type="button" onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} disabled={meta.current_page >= meta.last_page} variant="secondary" className="rounded-2xl">
            Suivant
          </Button>
        </div>
      ) : null}
    </MemberPageShell>
  );
}
