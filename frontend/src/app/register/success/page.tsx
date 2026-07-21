"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import PublicAuthLayout, { FeedbackMessage } from "@/components/PublicAuthLayout";
import { apiRequest } from "@/lib/api";

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

const adhesionStorageKey = "teranga_pending_adhesion";

export default function RegisterSuccessPage() {
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [status, setStatus] = useState<AdhesionStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const applicationFromUrl = params.get("application");
    const referenceFromUrl = params.get("reference") ?? params.get("token");
    const storedRaw = window.localStorage.getItem(adhesionStorageKey);
    const stored = storedRaw ? safeJsonParse<{ public_id?: string; reference?: string }>(storedRaw) : null;

    setApplicationId(applicationFromUrl ?? stored?.public_id ?? null);
    setReference(referenceFromUrl ?? stored?.reference ?? null);
  }, []);

  const loadStatus = useCallback(async () => {
    if (!applicationId && !reference) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = reference
        ? await apiRequest<AdhesionStatusResponse>(`/api/adhesion/payment/status?reference=${encodeURIComponent(reference)}`, { method: "GET" })
        : await apiRequest<AdhesionStatusResponse>(`/api/adhesion/${applicationId}/status`, { method: "GET" });

      setStatus(response);
      if (response.member) {
        window.localStorage.removeItem(adhesionStorageKey);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Statut adhesion indisponible.");
    } finally {
      setLoading(false);
    }
  }, [applicationId, reference]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if ((!applicationId && !reference) || status?.member || status?.application.statut === "paid" || status?.application.statut === "failed" || status?.application.statut === "expired") {
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
  }, [applicationId, loadStatus, reference, status?.application.statut, status?.member]);

  const member = status?.member;
  const application = status?.application;

  return (
    <PublicAuthLayout
      eyebrow="Adhesion"
      title={member ? "Adhesion active" : "Paiement en verification"}
      description="Verifiez le statut, puis connectez-vous avec le PIN choisi lors de votre inscription."
      variant="process"
      imageSrc="/hero-flyer-1.jpeg"
      imageAlt="Confirmation adhesion Teranga Business Hub"
      points={[
        "Le matricule devient votre identifiant de connexion.",
        "Votre code PIN est deja configure et reste confidentiel.",
        "Votre carte membre sera disponible dans l'espace membre.",
      ]}
      footerLinks={[
        { href: "/", label: "Retour accueil" },
        { href: "/login", label: "Connexion" },
      ]}
    >
      {loading ? <FeedbackMessage tone="info">Verification du statut de votre adhesion...</FeedbackMessage> : null}
      {error ? <FeedbackMessage tone="error">{error}</FeedbackMessage> : null}

      {member ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <p className="text-sm font-semibold">Matricule membre</p>
            <p className="mt-2 break-all text-3xl font-black">{member.matricule}</p>
            <p className="mt-3 text-sm leading-6">
              Bienvenue {member.prenom} {member.nom}. Conservez ce matricule pour vos connexions.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-950">Expiration</p>
            <p className="mt-1 text-xl font-black text-slate-950">{formatDate(member.date_expiration)}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
          <p className="text-sm font-semibold text-slate-950">Statut actuel</p>
          <p className="mt-2 text-2xl font-bold">{humanizeStatus(application?.statut)}</p>
          {application?.failure_reason ? <p className="mt-2 text-sm text-rose-700">{application.failure_reason}</p> : null}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button type="button" variant="secondary" onClick={() => void loadStatus()} disabled={loading} className="w-full">
          Actualiser
        </Button>
        {member ? (
          <Link href={`/login?identifier=${encodeURIComponent(member.matricule)}`}>
            <Button type="button" className="w-full">Me connecter</Button>
          </Link>
        ) : (
          <Link href="/register">
            <Button type="button" className="w-full">Relancer l'inscription</Button>
          </Link>
        )}
      </div>
    </PublicAuthLayout>
  );
}

function humanizeStatus(status?: string) {
  const labels: Record<string, string> = {
    draft: "Dossier cree",
    payment_pending: "Paiement en attente",
    paid: "Adhesion payee",
    failed: "Paiement echoue",
    expired: "Dossier expire",
  };

  return status ? labels[status] ?? status : "En attente";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "A confirmer";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
