"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { apiRequest, getAdminToken } from "@/lib/api";
import { useAdminGuard } from "@/lib/use-admin-guard";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AdminGuardLoading from "@/components/AdminGuardLoading";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const SETTINGS_UPDATE_CONFIRMATION = "CONFIRMER";

type SettingsResponse = {
  settings: {
    cotisation_montant_mensuel: number;
    payment_warning_unsold_months_threshold: number;
    auto_block_unsold_months_threshold: number;
  };
};

export default function BusinessSettingsPage() {
  const { ready } = useAdminGuard({ requireAdminRole: true, allowedStatuts: ["actif"] });
  const [cotisationMontantMensuel, setCotisationMontantMensuel] = useState(20000);
  const [warningThreshold, setWarningThreshold] = useState(1);
  const [autoBlockThreshold, setAutoBlockThreshold] = useState(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmSettingsOpen, setConfirmSettingsOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;

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
        setWarningThreshold(result.settings.payment_warning_unsold_months_threshold);
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
    return <AdminGuardLoading />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmSettingsOpen(true);
  }

  async function saveSettings() {
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
      const result = await apiRequest<{ message: string; settings: SettingsResponse["settings"] }>(
        "/api/admin/business-settings",
        {
          method: "PUT",
          body: JSON.stringify({
            settings: {
              cotisation_montant_mensuel: cotisationMontantMensuel,
              payment_warning_unsold_months_threshold: warningThreshold,
              auto_block_unsold_months_threshold: autoBlockThreshold,
            },
            confirmation_phrase: SETTINGS_UPDATE_CONFIRMATION,
          }),
        },
        token,
      );

      setCotisationMontantMensuel(result.settings.cotisation_montant_mensuel);
      setWarningThreshold(result.settings.payment_warning_unsold_months_threshold);
      setAutoBlockThreshold(result.settings.auto_block_unsold_months_threshold);
      setSuccess("Paramètres métier enregistrés.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
      setConfirmSettingsOpen(false);
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
        {error ? <p className="text-red-500">{error}</p> : null}
        {success ? <p className="text-emerald-700">{success}</p> : null}

        {!loading ? (
          <Card>
            <form onSubmit={onSubmit} className="space-y-5">
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
                <span className="text-sm text-slate-600">Seuil alerte paiement (mois non soldes)</span>
                <input
                  type="number"
                  min={1}
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
                <span className="block text-xs text-slate-500">A partir de ce nombre de mois, le membre apparait comme a risque et peut recevoir une notification.</span>
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-slate-600">Seuil blocage manuel (mois non soldes)</span>
                <input
                  type="number"
                  min={1}
                  value={autoBlockThreshold}
                  onChange={(e) => setAutoBlockThreshold(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
                <span className="block text-xs text-slate-500">Le blocage reste une action volontaire: la commande exige une confirmation explicite.</span>
              </label>

              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </form>
          </Card>
        ) : null}
      </div>
      <ConfirmDialog
        open={confirmSettingsOpen}
        title="Enregistrer ces parametres metier ?"
        description="Ces valeurs influencent les montants de cotisation, les alertes de retard et les decisions de blocage."
        confirmLabel="Enregistrer"
        tone="warning"
        loading={saving}
        requiredConfirmationText={SETTINGS_UPDATE_CONFIRMATION}
        onCancel={() => setConfirmSettingsOpen(false)}
        onConfirm={() => void saveSettings()}
        details={
          <div className="space-y-1">
            <p>Montant mensuel: {formatCurrency(cotisationMontantMensuel)}</p>
            <p>Seuil alerte: {warningThreshold} mois non soldes</p>
            <p>Seuil blocage: {autoBlockThreshold} mois non soldes</p>
          </div>
        }
      />
    </div>
  );
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}
