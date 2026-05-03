"use client";

import { FormEvent, useState } from "react";
import { apiRequest, getAuthToken } from "@/lib/api";
import { useStatusGuard } from "@/lib/use-status-guard";
import Button from "@/components/ui/Button";
import MemberPageShell, { MemberMessage } from "@/components/MemberPageShell";
import { formFieldClassName } from "@/components/PublicAuthLayout";

type PaiementResponse = {
  message: string;
  paiement: {
    reference: string;
    type: string;
    statut: string;
    montant: number;
  };
};

export default function CotisationPaymentPage() {
  const { ready } = useStatusGuard({ allowedStatuts: ["actif"] });
  const [montant, setMontant] = useState(20000);
  const [telephone, setTelephone] = useState("771234567");
  const [methode] = useState<"wave">("wave");
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateIdempotencyKey());
  const [result, setResult] = useState<PaiementResponse | null>(null);
  const [requestAccepted, setRequestAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!ready) {
    return <div className="min-h-screen bg-white" />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

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
            montant,
            telephone,
            methode_paiement: methode,
          }),
        },
        token,
      );

      setResult(data);
      setRequestAccepted(true);
      setIdempotencyKey(generateIdempotencyKey());
    } catch (err) {
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
    <MemberPageShell eyebrow="Paiement" title="Paiement de cotisation" description="Initiez un paiement avec un ecran plus clair, plus rassurant et mieux aligne sur le reste de l'application.">
      <div className="max-w-2xl rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <p className="mb-6 text-sm leading-7 text-slate-600">
          Le montant est libre. Le systeme applique d&apos;abord la plus ancienne cotisation non soldee, puis reporte le surplus automatiquement sur les mois suivants.
        </p>

        {!requestAccepted ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <input type="text" value="Cotisation" readOnly className={`${formFieldClassName} text-slate-600`} />
            <input type="number" value={montant} onChange={(e) => setMontant(Number(e.target.value))} className={formFieldClassName} min={100} />
            <input type="text" value={telephone} onChange={(e) => setTelephone(e.target.value)} className={formFieldClassName} />
            <input type="text" value="Wave" readOnly className={`${formFieldClassName} text-slate-600`} />
            <p className="text-xs text-slate-500">Orange Money sera ajoute ulterieurement.</p>
            <Button type="submit" disabled={loading} className="w-full rounded-2xl py-3">
              {loading ? "Traitement..." : "Payer"}
            </Button>
          </form>
        ) : (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">Paiement en cours de traitement</p>
            <p className="mt-2">Votre demande est enregistree. Vous serez notifie si le paiement est valide ou echoue.</p>
            <Button type="button" onClick={resetFormForNewPayment} variant="secondary" className="mt-4 rounded-2xl">Nouveau paiement</Button>
          </div>
        )}

        {error ? <div className="mt-4"><MemberMessage tone="error">{error}</MemberMessage></div> : null}
        {result ? (
          <div className="mt-4 rounded-[1.5rem] border border-blue-200 bg-blue-50 p-4 text-sm text-[color:var(--tbh-navy)]">
            <p>Reference: {result.paiement.reference}</p>
            <p>Type: {result.paiement.type}</p>
            <p>Statut: {result.paiement.statut}</p>
            <p>Montant: {result.paiement.montant} FCFA</p>
          </div>
        ) : null}
      </div>
    </MemberPageShell>
  );
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
