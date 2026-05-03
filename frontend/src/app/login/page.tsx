"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, clearAuthSession, LoginResponse, saveAuthSession } from "@/lib/api";
import { routeForStatut } from "@/lib/status-routing";
import Button from "@/components/ui/Button";
import PublicAuthLayout, { FeedbackMessage, formFieldClassName } from "@/components/PublicAuthLayout";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await apiRequest<LoginResponse>("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      saveAuthSession(result.token, result.user);
      router.push(routeForStatut(result.user.statut));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      if (message.toLowerCase().includes("bloque")) {
        clearAuthSession();
        router.push("/account-blocked");
        return;
      }
      if (
        message.toLowerCase().includes("non acceptee") ||
        message.toLowerCase().includes("pas acceptee") ||
        message.toLowerCase().includes("rejete")
      ) {
        clearAuthSession();
        router.push("/registration-rejected");
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthLayout
      eyebrow="Connexion"
      title="Accédez à votre espace membre"
      description="Retrouvez vos cotisations, vos paiements et vos informations personnelles dans un espace à l'image de TERANGA BUSINESS HUB."
      imageSrc="/hero-flyer-1.jpeg"
      imageAlt="Visuel d'accueil de Teranga Business Hub"
      points={[
        "Connexion rapide et sécurisée à votre compte membre.",
        "Accès direct à vos paiements, votre profil et votre carte membre.",
        "Une expérience plus rassurante et plus cohérente avec votre communication.",
      ]}
      footerLinks={[
        { href: "/forgot-password", label: "Mot de passe oublié" },
        { href: "/register", label: "Créer un compte" },
      ]}
    >
      <h2 className="text-3xl font-bold text-slate-950">Connexion</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Saisissez vos identifiants pour accéder à votre espace personnel.
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
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          className={formFieldClassName}
          required
        />

        {error ? <FeedbackMessage tone="error">{error}</FeedbackMessage> : null}

        <Button type="submit" disabled={loading} className="w-full rounded-2xl py-3 text-sm">
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>

      <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Besoin d&apos;aide ?</p>
        <p className="mt-1 leading-7">
          Si vous ne vous souvenez plus de vos accès, utilisez la procédure de réinitialisation ou contactez
          l’administration.
        </p>
        <Link href="/forgot-password" className="mt-3 inline-flex font-semibold text-[color:var(--tbh-red)]">
          Réinitialiser mon mot de passe
        </Link>
      </div>
    </PublicAuthLayout>
  );
}
