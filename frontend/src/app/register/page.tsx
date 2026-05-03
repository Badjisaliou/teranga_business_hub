"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import Button from "@/components/ui/Button";
import PublicAuthLayout, { FeedbackMessage, formFieldClassName } from "@/components/PublicAuthLayout";

type RegisterResponse = {
  message: string;
  user: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    statut: string;
  };
};

type RegistrationCheckResponse = {
  email: { valid_format: boolean; exists: boolean };
  telephone: { valid_format: boolean; exists: boolean; normalized: string | null };
  numero_cni: { valid_format: boolean; exists: boolean };
  can_register: boolean;
};

export default function RegisterPage() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [numeroCni, setNumeroCni] = useState("");
  const [adresse, setAdresse] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  async function runPrecheck(): Promise<boolean> {
    setCheckMessage(null);
    setChecking(true);

    try {
      const result = await apiRequest<RegistrationCheckResponse>("/api/register/check", {
        method: "POST",
        body: JSON.stringify({
          email,
          telephone,
          numero_cni: numeroCni,
        }),
      });

      if (!result.email.valid_format) {
        setError("Format email invalide.");
        return false;
      }
      if (result.email.exists) {
        setError("Cet email existe déjà.");
        return false;
      }
      if (!result.telephone.valid_format) {
        setError("Numéro de téléphone Sénégal invalide.");
        return false;
      }
      if (result.telephone.exists) {
        setError("Ce numéro de téléphone existe déjà.");
        return false;
      }
      if (!result.numero_cni.valid_format) {
        setError("Numéro CNI invalide (13 chiffres attendus).");
        return false;
      }
      if (result.numero_cni.exists) {
        setError("Ce numéro CNI existe déjà.");
        return false;
      }

      if (result.telephone.normalized) {
        setTelephone(result.telephone.normalized);
      }

      setCheckMessage("Vérification OK : email, téléphone et CNI valides.");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de vérification.");
      return false;
    } finally {
      setChecking(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCheckMessage(null);

    if (password !== passwordConfirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    const ok = await runPrecheck();
    if (!ok) {
      return;
    }

    setLoading(true);
    try {
      await apiRequest<RegisterResponse>("/api/register", {
        method: "POST",
        body: JSON.stringify({
          nom,
          prenom,
          email,
          telephone,
          numero_cni: numeroCni,
          adresse: adresse || null,
          password,
        }),
      });

      router.push("/register/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthLayout
      eyebrow="Inscription"
      title="Rejoignez une communauté plus accessible"
      description="La nouvelle présentation donne plus de confiance à l'inscription tout en conservant le même parcours de validation métier."
      imageSrc="/hero-flyer-2.jpeg"
      imageAlt="Visuel d'inscription Teranga Business Hub"
      points={[
        "Inscription simple avec vérification préalable des informations.",
        "Validation administrative avant activation du compte.",
        "Présentation plus moderne pour rassurer les nouveaux membres.",
      ]}
      footerLinks={[{ href: "/login", label: "J'ai déjà un compte" }]}
    >
      <h2 className="text-3xl font-bold text-slate-950">Inscription membre</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Remplissez vos informations pour lancer votre demande d’adhésion.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="text"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            placeholder="Prénom"
            className={formFieldClassName}
            required
          />
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Nom"
            className={formFieldClassName}
            required
          />
        </div>

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
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          placeholder="Téléphone"
          className={formFieldClassName}
          required
        />
        <input
          type="text"
          value={numeroCni}
          onChange={(e) => setNumeroCni(e.target.value)}
          placeholder="Numéro CNI"
          className={formFieldClassName}
          required
        />
        <input
          type="text"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          placeholder="Adresse (optionnel)"
          className={formFieldClassName}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
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

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setError(null);
              void runPrecheck();
            }}
            disabled={checking || loading}
            className="rounded-2xl px-5 py-3"
          >
            {checking ? "Vérification..." : "Vérifier mes infos"}
          </Button>
          <span className="text-xs leading-6 text-slate-500">
            Email, téléphone et CNI sont contrôlés avant l’enregistrement.
          </span>
        </div>

        {error ? <FeedbackMessage tone="error">{error}</FeedbackMessage> : null}
        {checkMessage ? <FeedbackMessage tone="success">{checkMessage}</FeedbackMessage> : null}

        <Button type="submit" disabled={loading} className="w-full rounded-2xl py-3 text-sm">
          {loading ? "Création..." : "Créer mon compte"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Vous avez déjà un compte ?{" "}
        <Link href="/login" className="font-semibold text-[color:var(--tbh-red)]">
          Se connecter
        </Link>
      </p>
    </PublicAuthLayout>
  );
}
