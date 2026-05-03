"use client";

import { useCallback, useEffect, useState } from "react";
import MemberPageShell, { MemberEmptyState, MemberMessage } from "@/components/MemberPageShell";
import Card from "@/components/ui/Card";
import { apiRequest, getAuthToken, MemberNotification } from "@/lib/api";
import { useStatusGuard } from "@/lib/use-status-guard";

type NotificationsResponse = {
  data: MemberNotification[];
  meta: {
    total: number;
    unread_count: number;
  };
};

export default function NotificationsPage() {
  const { ready } = useStatusGuard({ allowedStatuts: ["actif"] });
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | "all" | null>(null);

  const loadNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Token absent. Connectez-vous d'abord.");
    }

    const result = await apiRequest<NotificationsResponse>("/api/notifications", { method: "GET" }, token);
    setData(result);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    async function load() {
      try {
        await loadNotifications();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    }

    void load();
  }, [loadNotifications, ready]);

  async function markAsRead(notificationId: number) {
    const token = getAuthToken();
    if (!token) {
      setError("Session invalide.");
      return;
    }

    setBusyId(notificationId);
    setError(null);

    try {
      await apiRequest(`/api/notifications/${notificationId}/read`, { method: "POST" }, token);
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre la notification a jour.");
    } finally {
      setBusyId(null);
    }
  }

  async function markAllAsRead() {
    const token = getAuthToken();
    if (!token) {
      setError("Session invalide.");
      return;
    }

    setBusyId("all");
    setError(null);

    try {
      await apiRequest("/api/notifications/read-all", { method: "POST" }, token);
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de marquer toutes les notifications comme lues.");
    } finally {
      setBusyId(null);
    }
  }

  if (!ready) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <MemberPageShell
      eyebrow="Espace membre"
      title="Notifications"
      description="Consultez vos alertes de paiement, de statut et les mises a jour importantes de votre espace membre."
      aside={
        data ? (
          <div className="rounded-[1.5rem] border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Non lues</p>
            <p className="mt-2 text-3xl font-black">{data.meta.unread_count}</p>
            <p className="text-sm text-blue-50/80">{data.meta.total} notification(s) au total</p>
          </div>
        ) : null
      }
    >
      {error ? <MemberMessage tone="error">{error}</MemberMessage> : null}

      {data ? (
        <>
          <Card className="rounded-[2rem] border-white/70 bg-white/90 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Boite de notifications</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {data.meta.unread_count > 0
                    ? "Marquez les alertes lues une fois traitees."
                    : "Tout est a jour de votre cote."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                disabled={data.meta.unread_count === 0 || busyId === "all"}
                className="rounded-md bg-[color:var(--tbh-red)] px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyId === "all" ? "Mise a jour..." : "Tout marquer comme lu"}
              </button>
            </div>
          </Card>

          {data.data.length > 0 ? (
            <div className="grid gap-4">
              {data.data.map((notification) => {
                const isUnread = notification.statut === "non_lu";
                return (
                  <Card
                    key={notification.id}
                    className={`rounded-[1.5rem] p-5 ${isUnread ? "border-[color:var(--tbh-red)]/30 bg-rose-50/70" : "border-slate-200 bg-white/90"}`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                            {formatNotificationType(notification.type)}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${isUnread ? "bg-[color:var(--tbh-red)] text-white" : "bg-slate-200 text-slate-700"}`}>
                            {isUnread ? "Non lue" : "Lue"}
                          </span>
                        </div>
                        <p className="text-base leading-7 text-slate-800">{notification.message}</p>
                        <p className="text-sm text-slate-500">{formatNotificationDate(notification.date_envoi)}</p>
                      </div>

                      {isUnread ? (
                        <button
                          type="button"
                          onClick={() => void markAsRead(notification.id)}
                          disabled={busyId === notification.id}
                          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busyId === notification.id ? "Mise a jour..." : "Marquer comme lue"}
                        </button>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <MemberEmptyState>Aucune notification pour le moment.</MemberEmptyState>
          )}
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

function formatNotificationDate(value: string | null) {
  if (!value) {
    return "Date indisponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
