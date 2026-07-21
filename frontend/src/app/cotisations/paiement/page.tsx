"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest, getAuthToken, isApiError } from "@/lib/api";
import { useStatusGuard } from "@/lib/use-status-guard";
import Button from "@/components/ui/Button";
import MemberPageShell, { MemberMessage } from "@/components/MemberPageShell";
import { formFieldClassName } from "@/components/PublicAuthLayout";
import AppIcon from "@/components/ui/AppIcon";
import ListenButton from "@/components/ListenButton";
import SessionGuardLoading from "@/components/SessionGuardLoading";

type PaiementResponse = {
  message: string;
  paiement: {
    reference: string;
    type: string;
    statut: string;
    montant: number;
    methode_paiement: string;
    canal_paiement: PaymentChannel;
  };
  checkout_url?: string | null;
};

type PaymentChannel = "wave" | "orange_money" | "free_money" | "wizall" | "card";

type PreviewResponse = {
  montant: number;
  montant_mensuel: number;
  total_a_solder: number;
  repartition: Array<{
    cotisation_id: number | null;
    mois: number;
    annee: number;
    statut_initial: string;
    montant_deja_paye: number;
    montant_affecte: number;
    montant_apres_paiement: number;
    statut_apres_paiement: "a_jour" | "partiel";
  }>;
  reste_non_affecte: number;
};

export default function CotisationPaymentPage() {
  const { ready } = useStatusGuard({ allowedStatuts: ["actif"] });
  const [montant, setMontant] = useState("");
  const [canalPaiement, setCanalPaiement] = useState<PaymentChannel>("wave");
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateIdempotencyKey());
  const [result, setResult] = useState<PaiementResponse | null>(null);
  const [requestAccepted, setRequestAccepted] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [monthlyAmount, setMonthlyAmount] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    if (!ready) return;
    const token = getAuthToken();
    if (!token) return;
    void apiRequest<{ configuration: { montant_mensuel: number | null } }>("/api/cotisations", { method: "GET" }, token)
      .then((response) => setMonthlyAmount(response.configuration.montant_mensuel))
      .catch((err) => setError(err instanceof Error ? err.message : "Configuration indisponible."));
  }, [ready]);

  useEffect(() => {
    const montantNumerique = Number(montant);
    if (!ready || requestAccepted || !Number.isInteger(montantNumerique) || montantNumerique < 100) {
      setPreview(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const token = getAuthToken();
      if (!token) {
        return;
      }

      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const response = await apiRequest<PreviewResponse>(`/api/paiements/cotisation-preview?montant=${montantNumerique}`, { method: "GET" }, token);
        if (!cancelled) {
          setPreview(response);
        }
      } catch (err) {
        if (!cancelled) {
          setPreview(null);
          setPreviewError(err instanceof Error ? err.message : "Aperçu indisponible.");
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [montant, ready, requestAccepted]);

  if (!ready) {
    return <SessionGuardLoading />;
  }

  if (monthlyAmount === undefined) {
    return <SessionGuardLoading />;
  }

  if (monthlyAmount === null) {
    return (
      <MemberPageShell eyebrow="Paiement" title="Choix mensuel requis" description="Configurez votre cotisation mensuelle avant votre premier paiement.">
        <div className="max-w-xl rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-black text-slate-950">Choisissez d’abord votre formule</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">Vous devez choisir 5 000, 10 000 ou 20 000 FCFA par mois avant de commencer à cotiser.</p>
          <Link href="/cotisations"><Button type="button" className="mt-5 rounded-2xl">Choisir mon montant mensuel</Button></Link>
        </div>
      </MemberPageShell>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const montantNumerique = Number(montant);
    if (!Number.isInteger(montantNumerique) || montantNumerique < 100) {
      setError("Saisissez le montant que vous souhaitez cotiser (minimum 100 FCFA).");
      setLoading(false);
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Token absent. Connectez-vous d'abord.");
      }

      const data = await apiRequest<PaiementResponse>(
        "/api/paiement",
        {
          method: "POST",
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({
            type: "cotisation",
            montant: montantNumerique,
            methode_paiement: "dexpay",
            canal_paiement: canalPaiement,
          }),
        },
        token,
      );

      setResult(data);
      setRequestAccepted(true);
      setIdempotencyKey(generateIdempotencyKey());

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      if (isApiError(err)) {
        setIdempotencyKey(generateIdempotencyKey());
      }
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  function resetFormForNewPayment() {
    setRequestAccepted(false);
    setResult(null);
    setError(null);
    setIdempotencyKey(generateIdempotencyKey());
  }

  return (
    <MemberPageShell eyebrow="Paiement" title="Paiement de cotisation" description="Initiez un paiement avec un écran plus clair, plus rassurant et mieux aligné sur le reste de l'application.">
      <div className="max-w-2xl rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[color:var(--tbh-navy)]">
              <AppIcon name="speaker" className="h-6 w-6" />
            </span>
            <p className="text-sm leading-6 text-slate-700">
              Le montant est libre. Le système paie d&apos;abord le plus ancien mois non soldé.
            </p>
          </div>
          <ListenButton
            className="shrink-0"
            text="Cette page sert à payer vos cotisations. Choisissez un montant ou un bouton rapide. Le système paie d'abord le plus ancien mois non soldé. Vérifiez le numéro de téléphone, puis appuyez sur payer."
          />
        </div>

        {!requestAccepted ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <input type="text" value="Cotisation" readOnly className={`${formFieldClassName} text-slate-600`} />
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-800">Montant que vous souhaitez cotiser</span>
              <div className="relative">
                <input
                  type="number"
                  value={montant}
                  onChange={(event) => setMontant(event.target.value)}
                  placeholder="Exemple : 5 000"
                  className={`${formFieldClassName} pr-20`}
                  min={100}
                  step={100}
                  inputMode="numeric"
                  required
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-bold text-slate-500">FCFA</span>
              </div>
              <span className="mt-2 block text-xs text-slate-500">Montant libre à partir de 100 FCFA.</span>
            </label>
            <QuickAmounts monthlyAmount={preview?.montant_mensuel ?? monthlyAmount} preview={preview} onSelect={(amount) => setMontant(String(amount))} />
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
              DexPay utilisera le numéro de téléphone vérifié et enregistré dans votre profil membre.
            </p>
            <PaymentChannelSelector value={canalPaiement} onChange={setCanalPaiement} />
            <p className="text-xs text-slate-500">Le paiement est securise par DexPay. Selon le moyen choisi, vous serez redirige vers l'application mobile money ou invite a valider avec un code.</p>
            <PaymentPreview preview={preview} loading={previewLoading} error={previewError} />
            <Button type="submit" disabled={loading || Number(montant) < 100} className="w-full rounded-2xl py-3">
              {loading ? "Traitement..." : `Payer avec ${humanizePaymentChannel(canalPaiement)}`}
            </Button>
          </form>
        ) : (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">Paiement en cours de traitement</p>
            <p className="mt-2">Votre demande est enregistrée. Vous serez notifié si le paiement est validé ou échoué.</p>
            <Button type="button" onClick={resetFormForNewPayment} variant="secondary" className="mt-4 rounded-2xl">Nouveau paiement</Button>
          </div>
        )}

        {error ? <div className="mt-4"><MemberMessage tone="error">{error}</MemberMessage></div> : null}
        {result ? (
          <div className="mt-4 rounded-[1.5rem] border border-blue-200 bg-blue-50 p-4 text-sm text-[color:var(--tbh-navy)]">
            <p>Référence : {result.paiement.reference}</p>
            <p>Type: {result.paiement.type}</p>
            <p>Moyen : {humanizePaymentChannel(result.paiement.canal_paiement)} via DexPay</p>
            <p>Statut: {result.paiement.statut}</p>
            <p>Montant: {result.paiement.montant} FCFA</p>
          </div>
        ) : null}
      </div>
    </MemberPageShell>
  );
}

function PaymentChannelSelector({ value, onChange }: { value: PaymentChannel; onChange: (value: PaymentChannel) => void }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
        <AppIcon name="wallet" className="h-4 w-4 text-[color:var(--tbh-red)]" />
        Moyen de paiement
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as PaymentChannel)}
        className={formFieldClassName}
      >
        <option value="wave">Wave</option>
        <option value="orange_money">Orange Money</option>
        <option value="free_money">Free Money</option>
        <option value="wizall">Wizall</option>
        <option value="card">Carte bancaire</option>
      </select>
    </label>
  );
}

function QuickAmounts({
  monthlyAmount,
  preview,
  onSelect,
}: {
  monthlyAmount: number;
  preview: PreviewResponse | null;
  onSelect: (amount: number) => void;
}) {
  const totalDue = preview?.total_a_solder;

  const options = [
    { label: "1 mois", amount: monthlyAmount },
    { label: "2 mois", amount: monthlyAmount * 2 },
    { label: "3 mois", amount: monthlyAmount * 3 },
  ];

  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span>Montants rapides</span>
        {totalDue && totalDue > 0 ? <span>Total estimé à solder : {formatCurrency(totalDue)}</span> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onSelect(option.amount)}
            className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[color:var(--tbh-red)] hover:text-[color:var(--tbh-red)]"
          >
            {option.label}
          </button>
        ))}
        {totalDue && totalDue > 0 ? (
          <button
            type="button"
            onClick={() => onSelect(totalDue)}
            className="rounded-full border border-blue-200 bg-blue-100 px-3 py-2 text-xs font-semibold text-[color:var(--tbh-navy)] hover:bg-blue-200"
          >
            Tout solder
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PaymentPreview({ preview, loading, error }: { preview: PreviewResponse | null; loading: boolean; error: string | null }) {
  if (loading) {
    return <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Calcul des mois concernés...</div>;
  }

  if (error) {
    return <div className="rounded-[1.25rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  if (!preview) {
    return null;
  }

  return (
    <div className="rounded-[1.25rem] border border-blue-200 bg-blue-50 p-4 text-sm text-[color:var(--tbh-navy)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">Aperçu de répartition</p>
        <p>{formatCurrency(preview.montant)}</p>
      </div>
      <ul className="space-y-2">
        {preview.repartition.map((item) => (
          <li key={`${item.annee}-${item.mois}-${item.montant_affecte}`} className="rounded-lg bg-white/80 px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{formatMonth(item.mois, item.annee)}</span>
              <span>{formatCurrency(item.montant_affecte)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {formatCurrency(item.montant_deja_paye)} déjà payé, puis {formatCurrency(item.montant_apres_paiement)} après paiement ({humanizeCotisationStatus(item.statut_apres_paiement)})
            </p>
          </li>
        ))}
      </ul>
      {preview.reste_non_affecte > 0 ? <p className="mt-3 text-xs text-amber-700">Reste non affecté : {formatCurrency(preview.reste_non_affecte)}</p> : null}
    </div>
  );
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

function formatMonth(month: number, year: number) {
  return `${String(month).padStart(2, "0")}/${year}`;
}

function humanizeCotisationStatus(status: string) {
  const labels: Record<string, string> = {
    a_jour: "à jour",
    partiel: "partiel",
  };

  return labels[status] ?? status;
}

function humanizePaymentChannel(value?: string | null) {
  const labels: Record<string, string> = {
    wave: "Wave",
    orange_money: "Orange Money",
    free_money: "Free Money",
    wizall: "Wizall",
    card: "Carte bancaire",
  };

  return value ? labels[value] ?? value : "DexPay";
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
