"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import Button from "@/components/ui/Button";
import PublicAuthLayout, { FeedbackMessage, formFieldClassName } from "@/components/PublicAuthLayout";
import PinInput from "@/components/ui/PinInput";

export default function ResetPinPage() {
  return (
    <Suspense fallback={<ResetPinLoading />}>
      <ResetPinForm />
    </Suspense>
  );
}

function ResetPinLoading() {
  return (
    <PublicAuthLayout
      eyebrow="Nouveau PIN"
      title="Creez votre nouveau PIN"
      description="Chargement du lien de reinitialisation."
      variant="process"
      imageSrc="/hero-flyer-2.jpeg"
      imageAlt="Visuel de services Teranga Business Hub"
      footerLinks={[{ href: "/login", label: "Retour connexion" }]}
    >
      <FeedbackMessage tone="info">Chargement...</FeedbackMessage>
    </PublicAuthLayout>
  );
}

function ResetPinForm() {
  const params = useSearchParams();
  const [token, setToken] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirmation, setPinConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setToken(params.get("token") ?? "");
  }, [params]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Lien de reinitialisation absent.");
      return;
    }

    if (!/^[0-9]{6}$/.test(pin)) {
      setError("Le PIN doit contenir exactement 6 chiffres.");
      return;
    }

    if (pin !== pinConfirmation) {
      setError("Les deux PIN ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const result = await apiRequest<{ user: { statut: string } }>("/api/pin/reset", {
        method: "POST",
        body: JSON.stringify({
          token,
          pin,
          pin_confirmation: pinConfirmation,
        }),
      });
      setSuccess(
        result.user.statut === "bloque"
          ? "PIN reinitialise. Votre compte reste bloque : contactez l'administration pour son deblocage."
          : "PIN reinitialise. Vous pouvez maintenant vous connecter.",
      );
      setPin("");
      setPinConfirmation("");
      setToken("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reinitialisation impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthLayout
      eyebrow="Nouveau PIN"
      title="Nouveau PIN"
      description="Choisissez un PIN confidentiel a 6 chiffres."
      variant="process"
      imageSrc="/hero-flyer-2.jpeg"
      imageAlt="Visuel de services Teranga Business Hub"
      points={[
        "Le lien expire automatiquement.",
        "Le lien devient invalide apres utilisation.",
        "Vos anciennes sessions sont coupees apres le changement.",
      ]}
      footerLinks={[{ href: "/login", label: "Retour connexion" }]}
    >
      <form onSubmit={submit} className="space-y-4">
        <PinInput value={pin} onChange={setPin} label="Nouveau code PIN" autoComplete="new-password" />
        <PinInput value={pinConfirmation} onChange={setPinConfirmation} label="Confirmez le code PIN" autoComplete="new-password" />

        {error ? <FeedbackMessage tone="error">{error}</FeedbackMessage> : null}
        {success ? (
          <FeedbackMessage tone="success">
            {success} <Link href="/login" className="font-bold underline">Se connecter</Link>
          </FeedbackMessage>
        ) : null}

        <Button type="submit" disabled={loading || success !== null} className="w-full rounded-xl py-3 text-sm">
          {loading ? "Traitement..." : "Creer mon nouveau PIN"}
        </Button>
      </form>
    </PublicAuthLayout>
  );
}
