"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, getAuthToken, MemberNotification } from "@/lib/api";
import Card from "@/components/ui/Card";
import { useStatusGuard } from "@/lib/use-status-guard";
import MemberPageShell, { MemberEmptyState, MemberMessage } from "@/components/MemberPageShell";

type DashboardResponse = {
  user: {
    nom: string;
    prenom: string;
    email: string;
    statut: string;
    role: string;
  };
  stats: {
    total_paiements_succes: number;
    cotisations_a_jour: number;
    cotisations_non_soldees: number;
    notifications_non_lues: number;
  };
  dernieres_notifications: MemberNotification[];
};

const shortcuts = [
  { href: "/cotisations", label: "Mes cotisations" },
  { href: "/cotisations/paiement", label: "Payer une cotisation" },
  { href: "/paiements/historique", label: "Historique paiements" },
  { href: "/transparence", label: "Transparence" },
  { href: "/carte", label: "Carte membre" },
  { href: "/profil", label: "Mon profil" },
];

export default function DashboardPage() {
  const { ready } = useStatusGuard({ allowedStatuts: ["actif"] });
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) {
      return;
    }

    async function load() {
      const token = getAuthToken();
      if (!token) {
        setError("Token absent. Connectez-vous d'abord.");
        return;
      }

      try {
        const result = await apiRequest<DashboardResponse>("/api/dashboard", { method: "GET" }, token);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    }

    void load();
  }, [ready]);

  if (!ready) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <MemberPageShell
      eyebrow="Espace membre"
      title="Dashboard utilisateur"
      description="Retrouvez en un coup d'oeil vos indicateurs, vos services principaux et l'etat general de votre espace TERANGA BUSINESS HUB."
      aside={
        data ? (
          <div className="rounded-[1.5rem] border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Membre actif</p>
            <p className="mt-2 text-lg font-bold">
              {data.user.prenom} {data.user.nom}
            </p>
            <p className="text-sm text-blue-50/80">{data.user.email}</p>
          </div>
        ) : null
      }
    >
      {error ? <MemberMessage tone="error">{error}</MemberMessage> : null}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Paiements succes" value={String(data.stats.total_paiements_succes)} accent="red" />
            <StatCard label="Cotisations a jour" value={String(data.stats.cotisations_a_jour)} accent="navy" />
            <StatCard label="Cotisations non soldees" value={String(data.stats.cotisations_non_soldees)} accent="amber" />
          </div>

          <Card className="rounded-[2rem] border-white/70 bg-white/90 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Notifications</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {data.stats.notifications_non_lues > 0
                    ? `${data.stats.notifications_non_lues} notification(s) non lue(s) a consulter.`
                    : "Aucune notification en attente pour le moment."}
                </p>
              </div>
              <Link
                href="/notifications"
                className="inline-flex items-center justify-center rounded-md bg-[color:var(--tbh-navy)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
              >
                Ouvrir les notifications
              </Link>
            </div>

            <div className="mt-6 grid gap-3">
              {data.dernieres_notifications.length > 0 ? (
                data.dernieres_notifications.slice(0, 3).map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-[1rem] border px-4 py-3 ${
                      notification.statut === "non_lu" ? "border-[color:var(--tbh-red)]/30 bg-rose-50/70" : "border-slate-200 bg-slate-50/80"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{formatNotificationType(notification.type)}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        {notification.statut === "non_lu" ? "Non lue" : "Lue"}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{notification.message}</p>
                  </div>
                ))
              ) : (
                <MemberEmptyState>Aucune notification disponible.</MemberEmptyState>
              )}
            </div>
          </Card>

          <Card className="rounded-[2rem] border-white/70 bg-white/90 p-6">
            <h2 className="text-2xl font-bold text-slate-950">Services disponibles</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Accedez rapidement aux actions importantes de votre espace membre.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shortcuts.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 px-5 py-5 text-sm font-semibold text-[color:var(--tbh-navy)] transition hover:-translate-y-0.5 hover:border-[color:var(--tbh-red)] hover:bg-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <MemberEmptyState>Chargement...</MemberEmptyState>
      )}
    </MemberPageShell>
  );
}

function formatNotificationType(type: MemberNotification["type"]) {
  switch (type) {
    case "paiement":
      return "Paiement";
    case "retard":
      return "Retard";
    case "profil_incomplet":
      return "Profil incomplet";
    case "expiration":
      return "Expiration";
    default:
      return "Notification";
  }
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: "red" | "navy" | "amber" }) {
  const accentClass =
    accent === "red"
      ? "from-[color:var(--tbh-red)]/12 to-white"
      : accent === "amber"
        ? "from-amber-100 to-white"
        : "from-[color:var(--tbh-navy)]/12 to-white";

  return (
    <Card className={`rounded-[1.75rem] border-white/70 bg-gradient-to-br ${accentClass} p-6`}>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{value}</p>
    </Card>
  );
}
