"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest, getAdminToken } from "@/lib/api";
import { useAdminGuard } from "@/lib/use-admin-guard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AppIcon, { AppIconName } from "@/components/ui/AppIcon";
import AdminGuardLoading from "@/components/AdminGuardLoading";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { downloadAuthenticatedFile } from "@/lib/download";

type PaiementItem = {
  id: number;
  reference: string;
  type: "adhesion" | "cotisation";
  montant: number;
  methode_paiement: "wave" | "orange_money" | "dexpay";
  canal_paiement?: string | null;
  statut: "en_attente" | "succes" | "echoue";
  failure_reason?: string | null;
  date_paiement: string | null;
  created_at: string;
  user: {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
    email: string | null;
  } | null;
  cotisation: {
    id: number;
    mois: number;
    annee: number;
    statut: string;
  } | null;
};

type PaiementIncident = {
  id: number;
  source: "transaction";
  reference: string;
  type: "adhesion" | "cotisation";
  montant: number;
  methode_paiement: "wave" | "orange_money" | "dexpay";
  canal_paiement?: string | null;
  statut: "en_attente" | "echoue";
  failure_reason: string | null;
  created_at: string | null;
  user: PaiementItem["user"];
};

type PaiementsResponse = {
  data: PaiementItem[];
  incidents: PaiementIncident[];
  summary: {
    total_count: number;
    success_count: number;
    pending_count: number;
    failed_count: number;
    total_success_amount: number;
    incident_pending_count: number;
    incident_failed_count: number;
  };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export default function FinancePage() {
  const { ready } = useAdminGuard({ requireAdminRole: true, allowedStatuts: ["actif"] });
  const token = useMemo(() => getAdminToken(), []);

  const [items, setItems] = useState<PaiementItem[]>([]);
  const [incidents, setIncidents] = useState<PaiementIncident[]>([]);
  const [summary, setSummary] = useState<PaiementsResponse["summary"] | null>(null);
  const [meta, setMeta] = useState<PaiementsResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [remindingReference, setRemindingReference] = useState<string | null>(null);
  const [incidentToRemind, setIncidentToRemind] = useState<PaiementIncident | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState("");
  const [statut, setStatut] = useState("");
  const [methodePaiement, setMethodePaiement] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [includeRepartition, setIncludeRepartition] = useState(false);
  const [page, setPage] = useState(1);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (statut) params.set("statut", statut);
    if (methodePaiement) params.set("methode_paiement", methodePaiement);
    if (dateDebut) params.set("date_debut", dateDebut);
    if (dateFin) params.set("date_fin", dateFin);
    if (includeRepartition) params.set("include_repartition", "1");
    params.set("page", String(page));
    params.set("per_page", "20");
    return params.toString();
  }, [dateDebut, dateFin, includeRepartition, methodePaiement, page, statut, type]);

  const exportQueryString = useMemo(() => {
    const params = new URLSearchParams(queryString);
    params.delete("page");
    params.delete("per_page");
    return params.toString();
  }, [queryString]);

  const loadPaiements = useCallback(async () => {
    if (!ready || !token) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<PaiementsResponse>(`/api/admin/paiements?${queryString}`, { method: "GET" }, token);
      setItems(response.data ?? []);
      setIncidents(response.incidents ?? []);
      setSummary(response.summary);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [queryString, ready, token]);

  useEffect(() => {
    void loadPaiements();
  }, [loadPaiements]);

  if (!ready) {
    return <AdminGuardLoading />;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    void loadPaiements();
  }

  function resetFilters() {
    setType("");
    setStatut("");
    setMethodePaiement("");
    setDateDebut("");
    setDateFin("");
    setIncludeRepartition(false);
    setPage(1);
  }

  async function exportCsv() {
    if (!token) {
      setError("Session admin invalide.");
      return;
    }

    setExporting(true);
    setError(null);

    try {
      const suffix = exportQueryString ? `?${exportQueryString}` : "";
      await downloadAuthenticatedFile(
        `/api/admin/exports/paiements-csv${suffix}`,
        token,
        `paiements_export_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export CSV impossible.");
    } finally {
      setExporting(false);
    }
  }

  async function remindPayment(incident: PaiementIncident) {
    if (!token) {
      setError("Session admin invalide.");
      return;
    }

    setRemindingReference(incident.reference);
    setError(null);
    try {
      await apiRequest(
        "/api/admin/paiements/relance",
        {
          method: "POST",
          body: JSON.stringify({
            reference: incident.reference,
            source: incident.source,
          }),
        },
        token,
      );
      await loadPaiements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Relance impossible.");
    } finally {
      setRemindingReference(null);
    }
  }

  return (
    <div className="min-h-screen bg-white px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Finance</h1>
            <p className="mt-1 text-sm text-slate-600">Suivi des paiements, encaissements et exports.</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => void exportCsv()} disabled={exporting}>
            <span className="inline-flex items-center gap-2">
              <AppIcon name="history" className="h-4 w-4" />
            {exporting ? "Export..." : "Exporter CSV"}
            </span>
          </Button>
        </div>

        {summary ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard label="Total filtre" value={summary.total_count} icon="history" />
            <SummaryCard label="Succès" value={summary.success_count} icon="check" tone="success" />
            <SummaryCard label="En attente" value={summary.pending_count} icon="history" tone="warning" />
            <SummaryCard label="Échoués" value={summary.failed_count} icon="alert" tone="danger" />
            <SummaryCard label="Encaisse" value={formatCurrency(summary.total_success_amount)} icon="money" />
            <SummaryCard label="A suivre" value={summary.incident_pending_count + summary.incident_failed_count} icon="notification" tone="warning" />
          </div>
        ) : null}

        <Card>
          <form onSubmit={onSubmit} className="grid gap-3 lg:grid-cols-6">
            <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2">
              <option value="">Tous types</option>
              <option value="adhesion">Adhésion</option>
              <option value="cotisation">Cotisation</option>
            </select>
            <select value={statut} onChange={(e) => setStatut(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2">
              <option value="">Tous statuts</option>
              <option value="succes">Succès</option>
              <option value="en_attente">En attente</option>
              <option value="echoue">Échoué</option>
            </select>
            <select
              value={methodePaiement}
              onChange={(e) => setMethodePaiement(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              <option value="">Toutes methodes officielles</option>
              <option value="dexpay">DexPay</option>
            </select>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
            <div className="flex gap-2">
              <Button type="submit" variant="secondary">
                <span className="inline-flex items-center gap-2">
                  <AppIcon name="search" className="h-4 w-4" />
                Filtrer
                </span>
              </Button>
              <Button type="button" variant="secondary" onClick={resetFilters}>
                Reset
              </Button>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 lg:col-span-6">
              <input type="checkbox" checked={includeRepartition} onChange={(e) => setIncludeRepartition(e.target.checked)} />
              Inclure les lignes de repartition par cotisation
            </label>
          </form>
        </Card>

        {error ? <p className="text-red-500">{error}</p> : null}
        {loading ? <p className="text-slate-600">Chargement...</p> : null}

        {!loading && incidents.length > 0 ? (
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Paiements a suivre</h2>
                <p className="text-sm text-slate-600">Transactions DexPay ou mobile money en attente ou echouees, avant confirmation definitive.</p>
              </div>
              <Badge variant="warning">
                <span className="inline-flex items-center gap-1">
                  <AppIcon name="alert" className="h-3.5 w-3.5" />
                  {incidents.length} dossier(s)
                </span>
              </Badge>
            </div>
            <div className="space-y-3">
              {incidents.map((incident) => (
                <div key={`${incident.source}-${incident.id}`} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.2fr_1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${paymentStatusTone(incident.statut)}`}>
                        <AppIcon name={paymentStatusIcon(incident.statut)} className="h-4 w-4" />
                      </span>
                      <p className="font-semibold text-slate-950">{incident.reference}</p>
                      <Badge variant={paymentVariant(incident.statut)}>{humanizeStatus(incident.statut)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {humanizeType(incident.type)} - {formatCurrency(incident.montant)} - {humanizePaymentMethod(incident.methode_paiement)}
                      {incident.canal_paiement ? ` - ${humanizePaymentChannel(incident.canal_paiement)}` : ""}
                    </p>
                    {incident.failure_reason ? <p className="mt-1 text-sm text-rose-700">Raison: {incident.failure_reason}</p> : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    {incident.user ? (
                      <>
                        <Link href={`/users/${incident.user.id}`} className="font-semibold text-slate-900 hover:text-[color:var(--tbh-red)]">
                          {incident.user.prenom} {incident.user.nom}
                        </Link>
                        <p>{incident.user.email ?? "Email non renseigne"}</p>
                        <p>{incident.user.matricule}</p>
                      </>
                    ) : (
                      <p>Membre introuvable</p>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Button type="button" variant="secondary" onClick={() => setIncidentToRemind(incident)} disabled={remindingReference === incident.reference}>
                      <span className="inline-flex items-center gap-2">
                        <AppIcon name="notification" className="h-4 w-4" />
                      {remindingReference === incident.reference ? "Envoi..." : "Relancer"}
                      </span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {!loading && items.length === 0 ? (
          <Card>
            <p className="text-slate-600">Aucun paiement pour ces filtres.</p>
          </Card>
        ) : null}

        {items.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3">Référence</th>
                  <th className="px-4 py-3">Membre</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{item.reference}</p>
                      <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <AppIcon name={paymentMethodIcon(item.methode_paiement)} className="h-3.5 w-3.5" />
                        {humanizePaymentMethod(item.methode_paiement)}
                        {item.canal_paiement ? ` - ${humanizePaymentChannel(item.canal_paiement)}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {item.user ? (
                        <>
                          <Link href={`/users/${item.user.id}`} className="font-semibold text-slate-900 hover:text-[color:var(--tbh-red)]">
                            {item.user.prenom} {item.user.nom}
                          </Link>
                          <p className="text-xs text-slate-500">{item.user.matricule}</p>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p>{humanizeType(item.type)}</p>
                      {item.cotisation ? <p className="text-xs text-slate-500">{formatMonth(item.cotisation.mois, item.cotisation.annee)}</p> : null}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <AppIcon name="money" className="h-4 w-4 text-[color:var(--tbh-red)]" />
                        {formatCurrency(item.montant)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${paymentStatusTone(item.statut)}`}>
                          <AppIcon name={paymentStatusIcon(item.statut)} className="h-4 w-4" />
                        </span>
                      <Badge variant={paymentVariant(item.statut)}>{humanizeStatus(item.statut)}</Badge>
                      </span>
                      {item.failure_reason ? <p className="mt-1 text-xs text-rose-700">{item.failure_reason}</p> : null}
                    </td>
                    <td className="px-4 py-3">{formatDate(item.date_paiement ?? item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {meta && meta.last_page > 1 ? (
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" disabled={meta.current_page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Precedent
            </Button>
            <p className="text-sm text-slate-600">
              Page {meta.current_page} / {meta.last_page} ({meta.total} paiements)
            </p>
            <Button
              type="button"
              variant="secondary"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            >
              Suivant
            </Button>
          </div>
        ) : null}
      </div>
      <ConfirmDialog
        open={incidentToRemind !== null}
        title="Relancer ce paiement ?"
        description="Une notification de relance sera envoyee au membre concerne pour ce dossier de paiement."
        confirmLabel="Relancer"
        tone="warning"
        loading={incidentToRemind ? remindingReference === incidentToRemind.reference : false}
        onCancel={() => setIncidentToRemind(null)}
        onConfirm={() => {
          if (!incidentToRemind) {
            return;
          }

          void remindPayment(incidentToRemind).then(() => setIncidentToRemind(null));
        }}
        details={
          incidentToRemind ? (
            <div className="space-y-1">
              <p className="font-semibold text-slate-950">{incidentToRemind.reference}</p>
              <p>Membre: {incidentToRemind.user ? `${incidentToRemind.user.prenom} ${incidentToRemind.user.nom}` : "Membre introuvable"}</p>
              <p>Montant: {formatCurrency(incidentToRemind.montant)}</p>
            </div>
          ) : null
        }
      />
    </div>
  );
}

function SummaryCard({ label, value, icon, tone = "default" }: { label: string; value: number | string; icon: AppIconName; tone?: "default" | "success" | "warning" | "danger" }) {
  const toneClass = {
    default: "text-slate-900",
    success: "text-emerald-700",
    warning: "text-amber-600",
    danger: "text-rose-600",
  }[tone];

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 ${toneClass}`}>
          <AppIcon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className={`mt-1 text-xl font-bold ${toneClass}`}>{value}</p>
    </Card>
  );
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR");
}

function formatMonth(month: number, year: number) {
  return `${String(month).padStart(2, "0")}/${year}`;
}

function humanizePaymentMethod(value: string) {
  const labels: Record<string, string> = {
    wave: "Wave",
    orange_money: "Orange Money",
    dexpay: "DexPay",
  };

  return labels[value] ?? value;
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

function paymentVariant(status: string) {
  if (status === "succes") return "success";
  if (status === "echoue") return "danger";
  return "warning";
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
