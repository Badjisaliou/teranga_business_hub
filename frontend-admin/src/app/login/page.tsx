"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, clearAdminSession, isApiError, LoginResponse, saveAdminSession } from "@/lib/api";
import { routeForStatut } from "@/lib/status-routing";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
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
        body: JSON.stringify({ identifier, password }),
      });

      if (result.user.role !== "admin") {
        throw new Error("Ce compte n a pas les droits administrateur.");
      }

      saveAdminSession(result.token, result.user);
      router.push(routeForStatut(result.user.statut));
    } catch (err) {
      if (isApiError(err) && err.errorCode === "account_blocked") {
        clearAdminSession();
        router.push("/account-blocked");
        return;
      }
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white px-6 py-16 text-slate-900">
      <Card className="mx-auto w-full max-w-md">
        <h1 className="mb-6 text-2xl font-semibold">Connexion Admin</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Email ou téléphone admin"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            required
          />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Besoin de creer un compte membre ?{" "}
          <Link href="/register" className="font-semibold text-[color:var(--tbh-red)]">
            Inscription administrateur
          </Link>
        </p>
      </Card>
    </div>
  );
}
