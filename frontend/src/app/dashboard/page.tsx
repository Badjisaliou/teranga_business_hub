"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, getAuthToken, MemberNotification } from "@/lib/api";
import Card from "@/components/ui/Card";
import { useStatusGuard } from "@/lib/use-status-guard";
import MemberPageShell, { MemberEmptyState, MemberMessage } from "@/components/MemberPageShell";
import AppIcon, { AppIconName } from "@/components/ui/AppIcon";
import ListenButton from "@/components/ListenButton";
import SimpleMemberActions from "@/components/SimpleMemberActions";
import SessionGuardLoading from "@/components/SessionGuardLoading";

type DashboardResponse = {
  user: {
    matricule?: string;
    nom: string;
    prenom: string;
    email: string | null;
    telephone?: string | null;
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
  { href: "/cotisations", label: "Mes cotisations", icon: "calendar" },
  { href: "/cotisations/paiement", label: "Payer une cotisation", icon: "wallet" },
  { href: "/paiements/historique", label: "Historique paiements", icon: "history" },
  { href: "/carte", label: "Carte membre", icon: "card" },
  { href: "/profil", label: "Mon profil", icon: "profile" },
] satisfies Array<{ href: string; label: string; icon: AppIconName }>;

const notificationIcons: Record<MemberNotification["type"], AppIconName> = {
  paiement: "money",
  retard: "alert",
  profil_incomplet: "profile",
  expiration: "calendar",
};

const notificationIconTone: Record<MemberNotification["type"], string> = {
  paiement: "bg-emerald-100 text-emerald-700",
  retard: "bg-amber-100 text-amber-700",
  profil_incomplet: "bg-blue-100 text-[color:var(--tbh-navy)]",
  expiration: "bg-rose-100 text-rose-700",
};

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
    return <SessionGuardLoading />;
  }

  return (
    <MemberPageShell
      eyebrow="Espace membre"
      title="Tableau de bord membre"
      description="Retrouvez en un coup d'oeil vos indicateurs, vos services principaux et l'etat general de votre espace TERANGA BUSINESS HUB."
      aside={
        data ? (
          <div className="rounded-[1.5rem] border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Membre actif</p>
            <p className="mt-2 text-lg font-bold">
              {data.user.prenom} {data.user.nom}
            </p>
            <p className="text-sm text-blue-50/80">{data.user.matricule ?? "Matricule non renseigne"}</p>
            <p className="text-sm text-blue-50/70">{data.user.telephone ?? data.user.email ?? "Contact non renseigne"}</p>
          </div>
        ) : null
      }
    >
      {error ? <MemberMessage tone="error">{error}</MemberMessage> : null}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Paiements reussis" value={String(data.stats.total_paiements_succes)} accent="red" icon="money" />
            <StatCard label="Cotisations a jour" value={String(data.stats.cotisations_a_jour)} accent="navy" icon="check" />
            <StatCard label="Cotisations non soldees" value={String(data.stats.cotisations_non_soldees)} accent="amber" icon="alert" />
          </div>

          <SimpleMemberActions />

          <Card className="rounded-[2rem] border-emerald-100 bg-emerald-50/80 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Identifiant membre</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">{data.user.matricule ?? "-"}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Utilisez ce matricule ou votre telephone WhatsApp avec votre PIN pour vous connecter.
                </p>
              </div>
              <Link href="/carte" className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95">
                Voir ma carte
              </Link>
            </div>
          </Card>

          <Card className="rounded-[2rem] border-blue-100 bg-blue-50/70 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[color:var(--tbh-navy)] shadow-sm">
                  <AppIcon name="speaker" className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-slate-950">Ecouter l&apos;aide</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    Appuyez sur Ecouter pour entendre les actions principales de votre espace.
                  </p>
                </div>
              </div>
              <ListenButton text="Bienvenue dans votre espace membre Teranga Business Hub. Pour payer, appuyez sur Payer. Pour voir votre carte, appuyez sur Ma carte. Pour voir vos cotisations, appuyez sur Mes mois. Si vous avez besoin d'aide, utilisez le bouton Aide WhatsApp." />
            </div>
          </Card>

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
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${notificationIconTone[notification.type]}`}>
                          <AppIcon name={notificationIcons[notification.type]} />
                        </span>
                        <p className="text-sm font-semibold text-slate-900">{formatNotificationType(notification.type)}</p>
                      </div>
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
                  className="group flex min-h-28 items-center gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 px-5 py-5 text-sm font-semibold text-[color:var(--tbh-navy)] transition hover:-translate-y-0.5 hover:border-[color:var(--tbh-red)] hover:bg-white"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-[color:var(--tbh-red)] shadow-sm transition group-hover:bg-[color:var(--tbh-red)] group-hover:text-white">
                    <AppIcon name={item.icon} className="h-7 w-7" />
                  </span>
                  <span>{item.label}</span>
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

function StatCard({ label, value, accent, icon }: { label: string; value: string; accent: "red" | "navy" | "amber"; icon: AppIconName }) {
  const accentClass = {
    red: "from-[color:var(--tbh-red)]/12 to-white text-[color:var(--tbh-red)]",
    amber: "from-amber-100 to-white text-amber-700",
    navy: "from-[color:var(--tbh-navy)]/12 to-white text-[color:var(--tbh-navy)]",
  }[accent];

  return (
    <Card className={`rounded-[1.75rem] border-white/70 bg-gradient-to-br ${accentClass} p-6`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-600">{label}</p>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-sm">
          <AppIcon name={icon} className="h-6 w-6" />
        </span>
      </div>
      <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{value}</p>
    </Card>
  );
}
