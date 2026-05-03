"use client";

import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/api";
import Button from "@/components/ui/Button";
import PublicAuthLayout, { FeedbackMessage, formFieldClassName } from "@/components/PublicAuthLayout";

type ForgotPasswordResponse = {
  message: string;
  dev_reset_token?: string;
  email?: string;
};

export default function ForgotPasswordPage() {
  const [channel, setChannel] = useState<"email" | "telephone">("email");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setDevToken(null);
    setResolvedEmail(null);
    setLoading(true);

    try {
      const result = await apiRequest<ForgotPasswordResponse>("/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          channel,
          identifier,
        }),
      });

      setSuccess(result.message);
      setDevToken(result.dev_reset_token ?? null);
      setResolvedEmail(result.email ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthLayout
      eyebrow="Récupération"
      title="Récupérez votre accès en toute simplicité"
      description="Choisissez votre canal d'identification pour recevoir votre token de réinitialisation et reprendre la main sur votre compte."
      imageSrc="/hero-flyer-1.jpeg"
      imageAlt="Visuel d'accompagnement Teranga Business Hub"
      points={[
        "Demande possible par email ou numéro de téléphone.",
        "Procédure rapide pour retrouver l'accès à votre compte.",
        "Le design reste harmonisé avec la page d'accueil et le logo.",
      ]}
      footerLinks={[
        { href: "/login", label: "Retour connexion" },
        { href: "/reset-password", label: "J'ai déjà un token" },
      ]}
    >
      <h2 className="text-3xl font-bold text-slate-950">Mot de passe oublié</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Entrez votre email ou numéro de téléphone pour obtenir un token de réinitialisation.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as "email" | "telephone")}
          className={formFieldClassName}
        >
          <option value="email">Email</option>
          <option value="telephone">Téléphone</option>
        </select>

        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={channel === "email" ? "votre@email.com" : "77XXXXXXX ou +22177XXXXXXX"}
          className={formFieldClassName}
          required
        />

        {error ? <FeedbackMessage tone="error">{error}</FeedbackMessage> : null}
        {success ? <FeedbackMessage tone="success">{success}</FeedbackMessage> : null}

        {devToken ? (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">Mode test local</p>
            <p className="mt-2">Email: {resolvedEmail ?? "-"}</p>
            <p>Token: {devToken}</p>
            <p className="mt-2 text-xs">Utilisez ce token sur l’écran de réinitialisation.</p>
          </div>
        ) : null}

        <Button type="submit" disabled={loading} className="w-full rounded-2xl py-3 text-sm">
          {loading ? "Génération..." : "Générer token"}
        </Button>
      </form>
    </PublicAuthLayout>
  );
}
