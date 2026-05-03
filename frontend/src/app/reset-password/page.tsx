"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/api";
import Button from "@/components/ui/Button";
import PublicAuthLayout, { FeedbackMessage, formFieldClassName } from "@/components/PublicAuthLayout";

type ResetPasswordResponse = {
  message: string;
};

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== passwordConfirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const result = await apiRequest<ResetPasswordResponse>("/api/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email,
          token,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });
      setSuccess(result.message);
      setToken("");
      setPassword("");
      setPasswordConfirmation("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthLayout
      eyebrow="Nouveau mot de passe"
      title="Finalisez la recuperation de votre compte"
      description="Saisissez le token recu puis definissez un nouveau mot de passe pour retrouver un acces complet a votre espace membre."
      imageSrc="/hero-flyer-2.jpeg"
      imageAlt="Visuel de services Teranga Business Hub"
      points={[
        "Reinitialisation rapide avec email et token.",
        "Confirmation du nouveau mot de passe avant validation.",
        "Parcours aligne sur la nouvelle presentation generale du site.",
      ]}
      footerLinks={[{ href: "/login", label: "Retour connexion" }]}
    >
      <h2 className="text-3xl font-bold text-slate-950">Reinitialiser mot de passe</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Entrez l&apos;email du compte, le token recu, puis votre nouveau mot de passe.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={formFieldClassName}
          required
        />
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Token de reinitialisation"
          className={formFieldClassName}
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nouveau mot de passe"
            className={formFieldClassName}
            required
          />
          <input
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder="Confirmer mot de passe"
            className={formFieldClassName}
            required
          />
        </div>

        {error ? <FeedbackMessage tone="error">{error}</FeedbackMessage> : null}
        {success ? <FeedbackMessage tone="success">{success}</FeedbackMessage> : null}

        <Button type="submit" disabled={loading} className="w-full rounded-2xl py-3 text-sm">
          {loading ? "Mise a jour..." : "Reinitialiser"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        <Link href="/login" className="font-semibold text-[color:var(--tbh-red)]">
          Retour connexion
        </Link>
      </p>
    </PublicAuthLayout>
  );
}
