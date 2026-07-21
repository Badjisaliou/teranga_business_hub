"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PublicAuthLayout from "@/components/PublicAuthLayout";
import { apiRequest, clearAuthSession, getAuthToken, isApiError, refreshAuthUser } from "@/lib/api";

type PaymentStatusResponse = {
  status: "en_attente" | "succes" | "echoue";
  source: "paiement" | "transaction";
  paiement: {
    reference: string;
    type: "adhesion" | "cotisation";
    montant: number;
    methode_paiement: string;
    canal_paiement: string | null;
    statut: "en_attente" | "succes" | "echoue";
    date_paiement: string | null;
  };
};

type AdhesionStatusResponse = {
  application: {
    public_id: string;
    statut: "draft" | "payment_pending" | "paid" | "failed" | "expired";
    payment_reference: string | null;
    failure_reason: string | null;
  };
  member: null | {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
    statut: string;
    date_expiration?: string | null;
  };
};

export default function PaiementRetourPage() {
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [data, setData] = useState<PaymentStatusResponse | null>(null);
  const [adhesionData, setAdhesionData] = useState<AdhesionStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        if (paymentType === "cotisation") {
          setRequiresLogin(true);
          return;
        }
        const adhesionResponse = await apiRequest<AdhesionStatusResponse>(`/api/adhesion/payment/status?reference=${encodeURIComponent(token)}`, { method: "GET" });
        setAdhesionData(adhesionResponse);
        return;
      }

      try {
        const response = await apiRequest<PaymentStatusResponse>(`/api/paiement/status?reference=${encodeURIComponent(token)}`, { method: "GET" }, authToken);
        setData(response);
        if (response.status === "succes") {
          await refreshAuthUser(authToken);
        }
      } catch (err) {
        if (isApiError(err) && err.status === 401) {
          clearAuthSession();
          setRequiresLogin(true);
          return;
        }
        if (paymentType === "cotisation") {
          throw err;
        }
        const adhesionResponse = await apiRequest<AdhesionStatusResponse>(`/api/adhesion/payment/status?reference=${encodeURIComponent(token)}`, { method: "GET" });
        setAdhesionData(adhesionResponse);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Statut paiement indisponible.");
    } finally {
      setLoading(false);
    }
  }, [paymentType, token]);

  useEffect(() => {
    setHydrated(true);
    const searchParams = new URLSearchParams(window.location.search);
    setToken(searchParams.get("reference") ?? searchParams.get("token"));
    setPaymentType(searchParams.get("type"));
  }, []);

  useEffect(() => {
    if (token) {
      void loadStatus();
    }
  }, [loadStatus, token]);

  useEffect(() => {
    if (!token || requiresLogin || data?.status === "succes" || data?.status === "echoue" || adhesionData?.member || adhesionData?.application.statut === "paid" || adhesionData?.application.statut === "failed" || adhesionData?.application.statut === "expired") {
      return;
    }

    let attempts = 0;
    const intervalId = window.setInterval(() => {
      attempts += 1;
      void loadStatus();
      if (attempts >= 30) {
        window.clearInterval(intervalId);
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [adhesionData?.application.statut, adhesionData?.member, data?.status, loadStatus, requiresLogin, token]);

  const status = data?.status;
  const adhesionStatus = adhesionData?.application.statut;
  const title = data?.status === "succes" || adhesionData?.member ? "Paiement confirme" : "Verification paiement";

  return (
    <PublicAuthLayout
      eyebrow="DexPay"
      title={title}
      description="Consultez le statut du paiement et continuez votre parcours."
      variant="process"
      footerLinks={[{ href: "/", label: "Accueil" }]}
    >
        <div className="mb-4 flex items-center justify-between gap-3">
          {status ? <Badge variant={statusVariant(status)}>{humanizeStatus(status)}</Badge> : null}
          {adhesionStatus ? <Badge variant={adhesionStatus === "paid" ? "success" : adhesionStatus === "failed" ? "danger" : "warning"}>{humanizeAdhesionStatus(adhesionStatus)}</Badge> : null}
        </div>

        {hydrated && !token ? <p className="text-sm leading-6 text-slate-600">Aucune reference DexPay n&apos;a ete fournie dans l&apos;URL de retour.</p> : null}
        {loading ? <p className="text-sm text-slate-600">Verification du statut...</p> : null}
        {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {requiresLogin && token ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Votre session membre a expiré.</p>
            <p className="mt-2">Reconnectez-vous pour consulter ce paiement sans exposer vos informations financières.</p>
            <Link href={`/login?returnTo=${encodeURIComponent(`/paiement/retour?reference=${token}&type=cotisation`)}`} className="mt-4 inline-flex rounded-full bg-[color:var(--tbh-navy)] px-5 py-2.5 font-bold text-white">Me reconnecter</Link>
          </div>
        ) : null}

        {data ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p>{statusMessage(data.status, data.paiement.type)}</p>
            <div className="rounded-xl bg-slate-100 px-3 py-3">
              <p>Référence : {data.paiement.reference}</p>
              <p>Type: {humanizeType(data.paiement.type)}</p>
              <p>Montant: {formatCurrency(data.paiement.montant)}</p>
              <p>Moyen : {humanizePaymentChannel(data.paiement.canal_paiement)} via DexPay</p>
            </div>
          </div>
        ) : null}

        {adhesionData ? (
          <div className="space-y-3 text-sm text-slate-700">
            {adhesionData.member ? (
              <>
                <p>Votre adhesion est confirmee. Votre compte membre est actif.</p>
                <div className="rounded-xl bg-emerald-50 px-3 py-3 text-emerald-900">
                  <p>Matricule: <strong>{adhesionData.member.matricule}</strong></p>
                  <p>Membre: {adhesionData.member.prenom} {adhesionData.member.nom}</p>
                </div>
              </>
            ) : (
              <>
                <p>{adhesionMessage(adhesionData.application.statut)}</p>
                <div className="rounded-xl bg-slate-100 px-3 py-3">
                  <p>Reference: {adhesionData.application.payment_reference ?? token}</p>
                  <p>Statut: {humanizeAdhesionStatus(adhesionData.application.statut)}</p>
                  {adhesionData.application.failure_reason ? <p>Raison: {adhesionData.application.failure_reason}</p> : null}
                </div>
              </>
            )}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button type="button" onClick={() => void loadStatus()} variant="secondary" disabled={!token || loading} className="w-full">
            Actualiser
          </Button>
          {adhesionData?.member ? (
            <Link href={`/login?identifier=${encodeURIComponent(adhesionData.member.matricule)}`}>
              <Button type="button" className="w-full">Me connecter</Button>
            </Link>
          ) : (
            <>
              <Link href="/dashboard">
                <Button type="button" className="w-full">Dashboard</Button>
              </Link>
              <Link href="/paiements/historique">
                <Button type="button" variant="secondary" className="w-full">Historique</Button>
              </Link>
            </>
          )}
        </div>
    </PublicAuthLayout>
  );
}

function humanizeAdhesionStatus(status: string) {
  const labels: Record<string, string> = {
    draft: "Dossier cree",
    payment_pending: "En attente",
    paid: "Adhesion validee",
    failed: "Echoue",
    expired: "Expire",
  };

  return labels[status] ?? status;
}

function adhesionMessage(status: string) {
  if (status === "failed") return "Le paiement d'adhesion n'a pas ete valide.";
  if (status === "expired") return "Cette demande d'adhesion a expire.";
  return "Le paiement d'adhesion est encore en attente de confirmation DexPay.";
}

function statusVariant(status: string) {
  if (status === "succes") return "success";
  if (status === "echoue") return "danger";
  return "warning";
}

function humanizeStatus(status: string) {
  const labels: Record<string, string> = {
    succes: "Valide",
    en_attente: "En attente",
    echoue: "Échoué",
  };

  return labels[status] ?? status;
}

function humanizeType(type: string) {
  return type === "adhesion" ? "Adhésion" : "Cotisation";
}

function statusMessage(status: string, type: string) {
  if (status === "succes") {
    return type === "adhesion"
      ? "Votre adhésion est validée. Votre compte membre est actif."
      : "Votre paiement de cotisation est validé et affecté aux mois concernés.";
  }

  if (status === "echoue") {
    return "Le paiement n'a pas ete valide. Vous pouvez relancer une nouvelle demande.";
  }

  return "Le paiement est encore en attente de confirmation DexPay. Actualisez cette page dans quelques instants.";
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
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
