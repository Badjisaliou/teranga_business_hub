"use client";

import { useEffect, useState } from "react";
import { apiRequest, getAuthToken } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AppIcon, { AppIconName } from "@/components/ui/AppIcon";
import { useStatusGuard } from "@/lib/use-status-guard";
import MemberPageShell, { MemberEmptyState, MemberMessage } from "@/components/MemberPageShell";
import SessionGuardLoading from "@/components/SessionGuardLoading";

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
  configuration: CotisationConfiguration;
};

type CotisationConfiguration = {
  montant_mensuel: number | null;
  choix_requis: boolean;
  options: number[];
};

const moisLabels = ["", "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];

export default function CotisationsPage() {
  const { ready } = useStatusGuard({ allowedStatuts: ["actif"] });
  const [data, setData] = useState<CotisationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDetails, setOpenDetails] = useState<Record<number, boolean>>({});
  const [configuration, setConfiguration] = useState<CotisationConfiguration | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [savingChoice, setSavingChoice] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

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
        setConfiguration(result.configuration);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [ready]);

  if (!ready) {
    return <SessionGuardLoading />;
  }

  async function saveMonthlyAmount() {
    if (!selectedAmount) return;
    const token = getAuthToken();
    if (!token) return;

    setSavingChoice(true);
    setError(null);
    try {
      const result = await apiRequest<{ message: string; configuration: CotisationConfiguration }>(
        "/api/cotisations/montant-mensuel",
        { method: "POST", body: JSON.stringify({ montant_mensuel: selectedAmount }) },
        token,
      );
      setConfiguration(result.configuration);
      setSuccess(`Votre cotisation mensuelle est fixée à ${formatCurrency(selectedAmount)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Configuration impossible.");
    } finally {
      setSavingChoice(false);
    }
  }

  return (
    <MemberPageShell eyebrow="Suivi financier" title="Mes cotisations" description="Consultez vos mois soldés, partiels ou en retard avec le détail de chaque paiement associé.">
      {loading ? <MemberEmptyState>Chargement...</MemberEmptyState> : null}
      {error ? <MemberMessage tone="error">{error}</MemberMessage> : null}
      {success ? <MemberMessage tone="success">{success}</MemberMessage> : null}

      {!loading && configuration?.choix_requis ? (
        <section className="mb-6 rounded-[1.75rem] border border-blue-200 bg-blue-50 p-5 sm:p-7">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--tbh-red)]">Avant votre première cotisation</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Choisissez votre cotisation mensuelle</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Ce montant servira à calculer les mois soldés, partiels ou en retard. Après confirmation, ce choix sera définitif dès votre premier paiement.
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {configuration.options.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setSelectedAmount(amount)}
                className={`rounded-2xl border p-5 text-left transition ${selectedAmount === amount ? "border-[color:var(--tbh-red)] bg-white ring-2 ring-red-100" : "border-blue-200 bg-white/70 hover:bg-white"}`}
              >
                <span className="block text-2xl font-black text-slate-950">{formatCurrency(amount)}</span>
                <span className="mt-1 block text-sm text-slate-600">par mois</span>
              </button>
            ))}
          </div>
          <Button type="button" onClick={() => void saveMonthlyAmount()} disabled={!selectedAmount || savingChoice} className="mt-5 w-full rounded-2xl py-3 sm:w-auto sm:px-8">
            {savingChoice ? "Enregistrement..." : "Confirmer mon choix"}
          </Button>
        </section>
      ) : null}

      {!loading && configuration?.montant_mensuel ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <AppIcon name="check" className="h-5 w-5" />
          <span>Votre cotisation mensuelle : <strong>{formatCurrency(configuration.montant_mensuel)}</strong></span>
        </div>
      ) : null}
      {!loading && !error && data.length === 0 && !configuration?.choix_requis ? <MemberEmptyState>Aucune cotisation.</MemberEmptyState> : null}

      {data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((item) => {
            const detailsOpen = !!openDetails[item.id];
            const statusIcon = cotisationIcon(item.statut);
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
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.annee}</p>
                      <h2 className="text-2xl font-bold text-slate-950">{moisLabels[item.mois] ?? `Mois ${item.mois}`}</h2>
                    </div>
                    <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ${cotisationIconTone(item.statut)}`}>
                      <AppIcon name={statusIcon} className="h-7 w-7" />
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <AppIcon name="money" className="h-5 w-5 text-[color:var(--tbh-red)]" />
                    <span>Montant payé : {formatCurrency(item.montant_paye)}</span>
                  </div>
                  <Badge variant={cotisationBadgeVariant(item.statut)} className="px-3 py-1">
                    {humanizeCotisationStatus(item.statut)}
                  </Badge>

                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="inline-flex items-center gap-2 rounded-2xl"
                      onClick={() => setOpenDetails((prev) => ({ ...prev, [item.id]: !detailsOpen }))}
                    >
                      <AppIcon name={detailsOpen ? "check" : "history"} className="h-4 w-4" />
                      {detailsOpen ? "Masquer détail" : "Détail"}
                    </Button>
                  </div>

                  {detailsOpen ? (
                    <div className="rounded-[1.25rem] border border-white/80 bg-white/80 p-4">
                      <p className="mb-3 text-sm font-semibold text-slate-700">Paiements associés</p>
                      {item.paiements_associes.length === 0 ? (
                        <p className="text-sm text-slate-600">Aucun paiement associé pour ce mois.</p>
                      ) : (
                        <ul className="space-y-3 text-sm text-slate-700">
                          {item.paiements_associes.map((paiement) => (
                            <li key={paiement.id} className="rounded-[1rem] border border-slate-200 bg-white p-3">
                              <div className="flex items-start gap-3">
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${paymentStatusTone(paiement.statut)}`}>
                                  <AppIcon name={paymentStatusIcon(paiement.statut)} />
                                </span>
                                <div className="min-w-0 space-y-1">
                                  <p className="font-semibold text-slate-950">Référence : {paiement.reference}</p>
                                  <p className="flex items-center gap-2"><AppIcon name="money" className="h-4 w-4" /> {formatCurrency(paiement.montant)}</p>
                                  <p className="flex items-center gap-2"><AppIcon name="wallet" className="h-4 w-4" /> {humanizePaymentMethod(paiement.methode_paiement)}</p>
                                  <p className="flex items-center gap-2"><AppIcon name={paymentStatusIcon(paiement.statut)} className="h-4 w-4" /> {humanizePaymentStatus(paiement.statut)}</p>
                                  <p className="flex items-center gap-2"><AppIcon name="calendar" className="h-4 w-4" /> {formatPaymentDate(paiement)}</p>
                                </div>
                              </div>
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

function cotisationIcon(status: string): AppIconName {
  if (status === "solde" || status === "a_jour") return "check";
  if (status === "partiel") return "wallet";
  if (status === "en_retard") return "alert";
  return "calendar";
}

function cotisationIconTone(status: string) {
  if (status === "solde" || status === "a_jour") return "text-emerald-700";
  if (status === "partiel") return "text-amber-700";
  if (status === "en_retard") return "text-rose-700";
  return "text-slate-600";
}

function cotisationBadgeVariant(status: string) {
  if (status === "solde" || status === "a_jour") return "success";
  if (status === "partiel") return "warning";
  if (status === "en_retard") return "danger";
  return "neutral";
}

function humanizeCotisationStatus(status: string) {
  const labels: Record<string, string> = {
    solde: "Soldé",
    a_jour: "À jour",
    partiel: "Partiel",
    en_retard: "En retard",
    non_paye: "Non payé",
  };

  return labels[status] ?? status;
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

function humanizePaymentStatus(status: string) {
  const labels: Record<string, string> = {
    succes: "Succès",
    en_attente: "En attente",
    echoue: "Échoué",
  };

  return labels[status] ?? status;
}

function humanizePaymentMethod(value: string) {
  const labels: Record<string, string> = {
    wave: "Wave",
    orange_money: "Orange Money",
  };

  return labels[value] ?? value;
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

function formatPaymentDate(paiement: PaiementAssocie) {
  const value = paiement.date_paiement ?? paiement.created_at;
  return value ? new Date(value).toLocaleString("fr-FR") : "-";
}
