"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useAdminGuard } from "@/lib/use-admin-guard";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type RegisterResponse = {
  message: string;
  user: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    statut: string;
    role: string;
  };
};

type RegistrationCheckResponse = {
  email: { valid_format: boolean; exists: boolean };
  telephone: { valid_format: boolean; exists: boolean; normalized: string | null };
  numero_cni: { valid_format: boolean; exists: boolean };
  can_register: boolean;
};

export default function RegisterUserPage() {
  const { ready } = useAdminGuard({ requireAdminRole: true, allowedStatuts: ["actif"] });
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [numeroCni, setNumeroCni] = useState("");
  const [adresse, setAdresse] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  if (!ready) {
    return <div className="min-h-screen bg-white" />;
  }

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
        setError("Cet email existe deja.");
        return false;
      }
      if (!result.telephone.valid_format) {
        setError("Numero telephone Senegal invalide.");
        return false;
      }
      if (result.telephone.exists) {
        setError("Ce numero de telephone existe deja.");
        return false;
      }
      if (!result.numero_cni.valid_format) {
        setError("Numero CNI invalide (13 chiffres attendus).");
        return false;
      }
      if (result.numero_cni.exists) {
        setError("Ce numero CNI existe deja.");
        return false;
      }

      if (result.telephone.normalized) {
        setTelephone(result.telephone.normalized);
      }

      setCheckMessage("Verification OK: email, telephone et CNI valides.");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de verification.");
      return false;
    } finally {
      setChecking(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
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
      const result = await apiRequest<RegisterResponse>("/api/register", {
        method: "POST",
        body: JSON.stringify({
          nom,
          prenom,
          email,
          telephone,
          numero_cni: numeroCni,
          adresse: adresse || null,
          password,
          registration_source: "admin_portal",
          admin_registration_secret: adminSecret,
        }),
      });

      setSuccess(`Utilisateur créé (${result.user.email}) avec rôle ${result.user.role} et statut ${result.user.statut}.`);
      setNom("");
      setPrenom("");
      setEmail("");
      setTelephone("");
      setNumeroCni("");
      setAdresse("");
      setPassword("");
      setPasswordConfirmation("");
      setAdminSecret("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white px-6 py-16 text-slate-900">
      <Card className="mx-auto w-full max-w-xl">
        <h1 className="mb-2 text-2xl font-semibold">Inscription Utilisateur</h1>
        <p className="mb-6 text-sm text-slate-600">Créer rapidement un nouveau compte membre depuis l&apos;app admin.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Prénom"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              required
            />
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              required
            />
          </div>
          <div className="relative">
            <input
              type={showAdminSecret ? "text" : "password"}
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="Clé secrète admin portal"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-24"
              required
            />
            <button
              type="button"
              onClick={() => setShowAdminSecret((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-[color:var(--tbh-border)] px-2 py-1 text-xs text-slate-700"
            >
              {showAdminSecret ? "Masquer" : "Afficher"}
            </button>
          </div>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            required
          />
          <input
            type="text"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="Téléphone"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            required
          />
          <input
            type="text"
            value={numeroCni}
            onChange={(e) => setNumeroCni(e.target.value)}
            placeholder="Numéro CNI"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            required
          />
          <input
            type="text"
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            placeholder="Adresse (optionnel)"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              required
            />
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="Confirmer mot de passe"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {checkMessage ? <p className="text-sm text-emerald-400">{checkMessage}</p> : null}
          {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setError(null);
              setSuccess(null);
              void runPrecheck();
            }}
            disabled={checking || loading}
            className="w-full"
          >
            {checking ? "Vérification..." : "Vérifier les informations"}
          </Button>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Création..." : "Créer utilisateur"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-semibold text-[color:var(--tbh-red)]">
            Connexion admin
          </Link>
        </p>
      </Card>
    </div>
  );
}
