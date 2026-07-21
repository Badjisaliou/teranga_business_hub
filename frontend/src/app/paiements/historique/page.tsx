"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest, getAuthToken } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AppIcon, { AppIconName } from "@/components/ui/AppIcon";
import { useStatusGuard } from "@/lib/use-status-guard";
import MemberPageShell, { MemberEmptyState, MemberMessage } from "@/components/MemberPageShell";
import { formFieldClassName } from "@/components/PublicAuthLayout";
import SessionGuardLoading from "@/components/SessionGuardLoading";

type PaiementItem = {
  id: number;
  reference: string;
  type: "adhesion" | "cotisation";
  montant: number;
  methode_paiement: "wave" | "orange_money" | "dexpay";
  canal_paiement?: string | null;
  statut: "en_attente" | "succes" | "echoue";
  failure_reason?: string | null;
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

  if (!ready) return <SessionGuardLoading />;

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
            <option value="dexpay">DexPay</option>
          </select>
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className={formFieldClassName} />
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className={formFieldClassName} />
          <Button type="submit" variant="primary" className="inline-flex items-center justify-center gap-2 rounded-2xl py-3">
            <AppIcon name="history" className="h-4 w-4" />
            Filtrer
          </Button>
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
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-2">
                      <AppIcon name="calendar" className="h-4 w-4 text-slate-500" />
                      {new Date(item.created_at).toLocaleString("fr-FR")}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{item.reference}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-2">
                      <AppIcon name={item.type === "adhesion" ? "card" : "calendar"} className="h-4 w-4 text-[color:var(--tbh-red)]" />
                      {humanizeType(item.type)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-2 font-semibold">
                      <AppIcon name="money" className="h-4 w-4 text-[color:var(--tbh-red)]" />
                      {formatCurrency(item.montant)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-2">
                      <AppIcon name={paymentMethodIcon(item.methode_paiement)} className="h-4 w-4 text-slate-500" />
                      {humanizePaymentMethod(item.methode_paiement)}
                      {item.canal_paiement ? ` - ${humanizePaymentChannel(item.canal_paiement)}` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-2">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${paymentStatusTone(item.statut)}`}>
                        <AppIcon name={paymentStatusIcon(item.statut)} className="h-4 w-4" />
                      </span>
                      <Badge variant={item.statut === "succes" ? "success" : item.statut === "echoue" ? "danger" : "warning"}>
                        {humanizeStatus(item.statut)}
                      </Badge>
                    </span>
                    {item.failure_reason ? <p className="mt-1 text-xs text-rose-700">{item.failure_reason}</p> : null}
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

function humanizeType(value: string) {
  const labels: Record<string, string> = {
    adhesion: "Adhésion",
    cotisation: "Cotisation",
  };

  return labels[value] ?? value;
}

function humanizeStatus(value: string) {
  const labels: Record<string, string> = {
    succes: "Succès",
    en_attente: "En attente",
    echoue: "Échoué",
  };

  return labels[value] ?? value;
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

function humanizePaymentMethod(value: string) {
  const labels: Record<string, string> = {
    wave: "Wave",
    orange_money: "Orange Money",
    dexpay: "DexPay",
  };

  return labels[value] ?? value;
}

function paymentMethodIcon(value: string): AppIconName {
  if (value === "dexpay") return "shield";
  return "wallet";
}

function humanizePaymentChannel(value: string) {
  const labels: Record<string, string> = {
    wave: "Wave",
    orange_money: "Orange Money",
    free_money: "Free Money",
    wizall: "Wizall",
    card: "Carte bancaire",
  };

  return labels[value] ?? value;
}

function paymentStatusIcon(status: string): AppIconName {
  if (status === "succes") return "check";
  if (status === "echoue") return "alert";
  return "history";
}

function paymentStatusTone(status: string) {
  if (status === "succes") return "bg-emerald-100 text-emerald-700";
  if (status === "echoue") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}
