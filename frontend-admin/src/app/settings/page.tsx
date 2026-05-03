"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { apiRequest, getAdminToken } from "@/lib/api";
import { useAdminGuard } from "@/lib/use-admin-guard";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type SettingsResponse = {
  settings: {
    cotisation_montant_mensuel: number;
    auto_block_unsold_months_threshold: number;
  };
};

export default function BusinessSettingsPage() {
  const { ready } = useAdminGuard({ requireAdminRole: true, allowedStatuts: ["actif"] });
  const [cotisationMontantMensuel, setCotisationMontantMensuel] = useState(20000);
  const [autoBlockThreshold, setAutoBlockThreshold] = useState(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) {
      return;
    }

    async function load() {
      const token = getAdminToken();
      if (!token) {
        setError("Session admin invalide.");
        setLoading(false);
        return;
      }

      try {
        const result = await apiRequest<SettingsResponse>("/api/admin/business-settings", { method: "GET" }, token);
        setCotisationMontantMensuel(result.settings.cotisation_montant_mensuel);
        setAutoBlockThreshold(result.settings.auto_block_unsold_months_threshold);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [ready]);

  if (!ready) {
    return <div className="min-h-screen bg-white" />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const token = getAdminToken();
    if (!token) {
      setError("Session admin invalide.");
      setSaving(false);
      return;
    }

    try {
      const result = await apiRequest<{
        message: string;
        settings: SettingsResponse["settings"];
      }>(
        "/api/admin/business-settings",
        {
          method: "PUT",
          body: JSON.stringify({
            settings: {
              cotisation_montant_mensuel: cotisationMontantMensuel,
              auto_block_unsold_months_threshold: autoBlockThreshold,
            },
          }),
        },
        token,
      );

      setCotisationMontantMensuel(result.settings.cotisation_montant_mensuel);
      setAutoBlockThreshold(result.settings.auto_block_unsold_months_threshold);
      setSuccess("Paramètres métier enregistrés.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Paramètres métier</h1>
          <Link href="/dashboard" className="rounded-lg border border-[color:var(--tbh-border)] px-3 py-2 text-sm">
            Retour au dashboard
          </Link>
        </div>

        {loading ? <p className="text-slate-600">Chargement...</p> : null}
        {error ? <p className="text-red-400">{error}</p> : null}
        {success ? <p className="text-emerald-400">{success}</p> : null}

        {!loading ? (
          <Card>
            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm text-slate-600">Montant mensuel cotisation (FCFA)</span>
                <input
                  type="number"
                  min={1}
                  value={cotisationMontantMensuel}
                  onChange={(e) => setCotisationMontantMensuel(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-slate-600">Seuil blocage automatique (mois non soldés)</span>
                <input
                  type="number"
                  min={1}
                  value={autoBlockThreshold}
                  onChange={(e) => setAutoBlockThreshold(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </label>

              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </form>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
