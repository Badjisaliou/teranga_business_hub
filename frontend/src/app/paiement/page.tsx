"use client";

import { FormEvent, useState } from "react";
import { apiRequest, getAuthToken } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useStatusGuard } from "@/lib/use-status-guard";

type PaiementResponse = {
  message: string;
  paiement: {
    reference: string;
    type: string;
    statut: string;
    montant: number;
  };
};

export default function PaiementPage() {
  const { ready } = useStatusGuard({ allowedStatuts: ["attente_adhesion"] });
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
            type: "adhesion",
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
    <div className="min-h-screen bg-white px-6 py-16 text-slate-900">
      <Card className="mx-auto max-w-xl">
        <Badge variant="warning" className="mb-3">
          Statut: attente_adhesion
        </Badge>
        <h1 className="mb-2 text-2xl font-semibold">Paiement des frais d&apos;adhésion</h1>
        <p className="mb-6 text-sm text-slate-600">
          Pour activer votre compte membre, vous devez régler exactement 10 000 FCFA.
        </p>
        {!requestAccepted ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <input type="text" value="Adhésion" readOnly className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-600" />
            <input type="number" value={10000} readOnly className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-600" />
            <input
              type="text"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
            <input type="text" value="Wave" readOnly className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-600" />
            <p className="text-xs text-slate-500">Orange Money sera ajoute ulterieurement.</p>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Traitement..." : "Payer"}
            </Button>
          </form>
        ) : (
          <div className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-4 text-sm text-amber-100">
            <p className="font-semibold">Paiement en cours de traitement</p>
            <p className="mt-1">
              Votre demande est enregistrée. Vous serez notifié si le paiement est validé ou échoué.
            </p>
            <Button type="button" onClick={resetFormForNewPayment} variant="secondary" className="mt-3">
              Nouveau paiement
            </Button>
          </div>
        )}

        {error ? <p className="mt-4 text-red-400">{error}</p> : null}
        {result ? (
          <div className="mt-4 rounded-lg border border-cyan-700 bg-cyan-950/40 p-3 text-sm">
            <p>Référence : {result.paiement.reference}</p>
            <p>Type: {result.paiement.type}</p>
            <p>Statut: {result.paiement.statut}</p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
