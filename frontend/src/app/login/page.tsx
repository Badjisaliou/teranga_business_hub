"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, clearAuthSession, isApiError, LoginResponse, saveAuthSession } from "@/lib/api";
import { routeForStatut } from "@/lib/status-routing";
import Button from "@/components/ui/Button";
import PublicAuthLayout, { FeedbackMessage, formFieldClassName } from "@/components/PublicAuthLayout";
import { getSupportHelpHref, isSupportWhatsAppConfigured } from "@/lib/support";
import PinInput from "@/components/ui/PinInput";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [showPinResetHelp, setShowPinResetHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const helpUrl = getSupportHelpHref("Bonjour, j'ai besoin d'aide pour me connecter a mon espace TERANGA BUSINESS HUB.");
  const helpIsWhatsApp = isSupportWhatsAppConfigured();
  const pinResetHelpUrl = getSupportHelpHref(
    `Bonjour, je souhaite reinitialiser mon PIN TERANGA BUSINESS HUB. Mon identifiant est : ${identifier || "a renseigner"}.`,
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryIdentifier = params.get("identifier");
    const requestedReturnTo = params.get("returnTo");
    if (requestedReturnTo?.startsWith("/") && !requestedReturnTo.startsWith("//")) {
      setReturnTo(requestedReturnTo);
    }
    if (queryIdentifier) {
      setIdentifier(queryIdentifier);
      setInfo("Saisissez le code PIN choisi lors de votre inscription.");
      setShowPinResetHelp(false);
    }
  }, []);

  async function forgotPin() {
    setError(null);
    setInfo(null);
    setShowPinResetHelp(false);
    if (!identifier) {
      setError("Saisissez votre matricule ou telephone avant de demander l'aide de l'administration.");
      return;
    }

    setLoading(true);
    try {
      const result = await apiRequest<{ message: string }>("/api/pin/forgot", {
        method: "POST",
        body: JSON.stringify({ identifier }),
      });
      setInfo(result.message);
      setShowPinResetHelp(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demande de reset PIN impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setShowPinResetHelp(false);

    if (!/^[0-9]{6}$/.test(pin)) {
      setError("Le PIN doit contenir exactement 6 chiffres.");
      return;
    }

    setLoading(true);
    try {
      const result = await apiRequest<LoginResponse>("/api/login", {
        method: "POST",
        body: JSON.stringify({ identifier, pin }),
      });

      saveAuthSession(result.token, result.user);
      router.push(returnTo ?? routeForStatut(result.user.statut));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      const blockedAccountError =
        isApiError(err) &&
        (err.errorCode === "account_blocked" || /bloqu/i.test(message));

      if (blockedAccountError) {
        clearAuthSession();
        router.push("/account-blocked");
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
      title="Connexion membre"
      description="Saisissez votre matricule ou telephone, puis votre PIN a 6 chiffres."
      variant="process"
      imageSrc="/hero-flyer-1.jpeg"
      imageAlt="Visuel d'accueil de Teranga Business Hub"
      points={[
        "Matricule ou telephone WhatsApp comme identifiant.",
        "Code PIN a 6 chiffres choisi lors de l'inscription.",
        "Acces direct des la confirmation de votre adhesion.",
      ]}
      footerLinks={[
        { href: "/register", label: "Devenir membre" },
      ]}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-800">Matricule ou telephone</span>
          <input
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Ex: TBH2607081234 ou 771234567"
            autoComplete="username"
            className={formFieldClassName}
            required
          />
        </label>

        <PinInput value={pin} onChange={setPin} label="Code PIN" />

        {error ? <FeedbackMessage tone="error">{error}</FeedbackMessage> : null}
        {info ? (
          <FeedbackMessage tone="info">
            {info}
            {showPinResetHelp ? (
              <>
                {" "}
                <a
                  href={pinResetHelpUrl}
                  target={helpIsWhatsApp ? "_blank" : undefined}
                  rel={helpIsWhatsApp ? "noreferrer" : undefined}
                  className="font-bold underline"
                >
                  Demander mon lien
                </a>
              </>
            ) : null}
          </FeedbackMessage>
        ) : null}

        <Button type="submit" disabled={loading} className="w-full rounded-xl py-3 text-sm">
          {loading ? "Traitement..." : "Se connecter"}
        </Button>

        <div>
          <Button type="button" variant="ghost" onClick={() => void forgotPin()} disabled={loading || !identifier} className="w-full rounded-xl px-5 py-3">
            PIN oublie
          </Button>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <a
          href={helpUrl}
          target={helpIsWhatsApp ? "_blank" : undefined}
          rel={helpIsWhatsApp ? "noreferrer" : undefined}
          className="font-semibold text-emerald-700"
        >
          Aide WhatsApp
        </a>
        <Link href="/register" className="font-semibold text-[color:var(--tbh-red)]">
          Devenir membre
        </Link>
      </div>
    </PublicAuthLayout>
  );
}
