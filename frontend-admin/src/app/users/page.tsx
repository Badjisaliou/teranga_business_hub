"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest, getAdminToken } from "@/lib/api";
import { useAdminGuard } from "@/lib/use-admin-guard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AppIcon, { AppIconName } from "@/components/ui/AppIcon";
import AdminGuardLoading from "@/components/AdminGuardLoading";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const MEMBER_BLOCK_CONFIRMATION = "BLOQUER";

type UserItem = {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  statut: "actif" | "bloque";
  role: "membre";
  card_token: string | null;
  date_expiration: string | null;
  created_at: string;
  updated_at: string;
};

type MembersResponse = {
  data: UserItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  stats: {
    total_membres: number;
    actifs: number;
    bloques: number;
    cartes_expirees: number;
    cartes_invalides: number;
  };
};

type PendingUserAction = {
  user: UserItem;
  endpoint: string;
  description: string;
  title: string;
  message: string;
  confirmLabel: string;
  tone: "default" | "danger" | "warning";
  confirmationPhrase?: string;
};

export default function AdminUsersPage() {
  const { ready } = useAdminGuard({ requireAdminRole: true, allowedStatuts: ["actif"] });
  const token = useMemo(() => getAdminToken(), []);

  const [items, setItems] = useState<UserItem[]>([]);
  const [meta, setMeta] = useState<MembersResponse["meta"] | null>(null);
  const [stats, setStats] = useState<MembersResponse["stats"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingUserAction | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("statut") ?? "";
  });
  const [cardStatus, setCardStatus] = useState("");
  const [page, setPage] = useState(1);

  const loadMembers = useCallback(async () => {
    if (!ready || !token) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statut) params.set("statut", statut);
      if (cardStatus) params.set("card_status", cardStatus);
      params.set("page", String(page));
      params.set("per_page", "12");

      const response = await apiRequest<MembersResponse>(`/api/admin/membres?${params.toString()}`, { method: "GET" }, token);
      setItems(response.data ?? []);
      setMeta(response.meta ?? null);
      setStats(response.stats ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [cardStatus, page, ready, search, statut, token]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  if (!ready) {
    return <AdminGuardLoading />;
  }

  async function mutateUser(userId: number, endpoint: string, description: string, confirmationPhrase?: string) {
    try {
      setBusyUserId(userId);
      setError(null);

      await apiRequest(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify({
            user_id: userId,
            description,
            ...(confirmationPhrase ? { confirmation_phrase: confirmationPhrase } : {}),
          }),
        },
        token,
      );

      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusyUserId(null);
    }
  }

  async function confirmPendingAction() {
    if (!pendingAction) {
      return;
    }

    await mutateUser(pendingAction.user.id, pendingAction.endpoint, pendingAction.description, pendingAction.confirmationPhrase);
    setPendingAction(null);
  }

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <div className="min-h-screen bg-white px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Vue globale des membres</h1>
          <Link href="/dashboard" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            Retour au dashboard
          </Link>
        </div>

        {stats ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total membres" value={stats.total_membres} icon="users" />
            <StatCard label="Actifs" value={stats.actifs} icon="check" tone="success" />
            <StatCard label="Membres bloques" value={stats.bloques} icon="lock" tone="danger" />
            <StatCard label="Cartes expirees" value={stats.cartes_expirees} icon="card" tone="warning" />
            <StatCard label="Cartes invalides" value={stats.cartes_invalides} icon="alert" tone="danger" />
          </div>
        ) : null}

        <Card>
          <form onSubmit={onSearchSubmit} className="grid gap-3 md:grid-cols-[1fr_180px_190px_auto]">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher nom, prÃ©nom, email, tÃ©lÃ©phone ou matricule"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
            <select
              value={statut}
              onChange={(e) => {
                setPage(1);
                setStatut(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="bloque">Bloque</option>
            </select>
            <select
              value={cardStatus}
              onChange={(e) => {
                setPage(1);
                setCardStatus(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              <option value="">Toutes cartes</option>
              <option value="valide">Carte valide</option>
              <option value="expiree">Carte expiree</option>
              <option value="invalide">Carte invalide</option>
            </select>
            <Button type="submit" variant="secondary">
              <span className="inline-flex items-center gap-2">
                <AppIcon name="search" className="h-4 w-4" />
              Rechercher
              </span>
            </Button>
          </form>
        </Card>

        {error ? <p className="text-red-500">{error}</p> : null}
        {loading ? <p className="text-slate-600">Chargement...</p> : null}

        {!loading && items.length === 0 ? (
          <Card>
            <p className="text-slate-600">Aucun membre trouve pour ces criteres.</p>
          </Card>
        ) : null}

        {items.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3">Membre</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Carte</th>
                  <th className="px-4 py-3">Inscription</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((user) => (
                  <tr key={user.id} className="border-t border-slate-200">
                    <td className="px-4 py-3">
                      <Link href={`/users/${user.id}`} className="font-semibold text-slate-900 hover:text-[color:var(--tbh-red)]">
                        <span className="inline-flex items-center gap-2">
                          <AppIcon name="profile" className="h-4 w-4 text-[color:var(--tbh-red)]" />
                          {user.prenom} {user.nom}
                        </span>
                      </Link>
                      <p className="text-xs text-slate-500">{user.matricule}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{user.email ?? "Email non renseigne"}</p>
                      <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <AppIcon name="phone" className="h-3.5 w-3.5" />
                        {user.telephone ?? "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${statusIconTone(user.statut)}`}>
                          <AppIcon name={statusIcon(user.statut)} className="h-4 w-4" />
                        </span>
                      <Badge
                        variant={
                          user.statut === "actif"
                            ? "success"
                            : user.statut === "bloque"
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {humanizeStatus(user.statut)}
                      </Badge>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={cardVariant(user)}>{humanizeCardStatus(user)}</Badge>
                      <p className="mt-1 text-xs text-slate-500">{formatCardExpiration(user.date_expiration)}</p>
                    </td>
                    <td className="px-4 py-3">{new Date(user.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link href={`/users/${user.id}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                          Voir
                        </Link>
                        {user.statut === "actif" ? (
                          <Button
                            type="button"
                            variant="danger"
                            disabled={busyUserId === user.id}
                            onClick={() => setPendingAction(actionForUser(user, "block"))}
                          >
                            Bloquer
                          </Button>
                        ) : null}

                        {user.statut === "bloque" ? (
                          <Button
                            type="button"
                            disabled={busyUserId === user.id}
                            onClick={() => setPendingAction(actionForUser(user, "unblock"))}
                          >
                            Debloquer
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {meta && meta.last_page > 1 ? (
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" disabled={meta.current_page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Precedent
            </Button>
            <p className="text-sm text-slate-600">
              Page {meta.current_page} / {meta.last_page} ({meta.total} membres)
            </p>
            <Button
              type="button"
              variant="secondary"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            >
              Suivant
            </Button>
          </div>
        ) : null}
      </div>
      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction?.title ?? ""}
        description={pendingAction?.message ?? ""}
        confirmLabel={pendingAction?.confirmLabel ?? "Confirmer"}
        tone={pendingAction?.tone}
        loading={pendingAction ? busyUserId === pendingAction.user.id : false}
        requiredConfirmationText={pendingAction?.confirmationPhrase}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => void confirmPendingAction()}
        details={
          pendingAction ? (
            <div className="space-y-1">
              <p className="font-semibold text-slate-950">
                {pendingAction.user.prenom} {pendingAction.user.nom}
              </p>
              <p>Matricule: {pendingAction.user.matricule}</p>
              <p>Statut actuel: {humanizeStatus(pendingAction.user.statut)}</p>
            </div>
          ) : null
        }
      />
    </div>
  );
}

function actionForUser(user: UserItem, action: "block" | "unblock"): PendingUserAction {
  const fullName = `${user.prenom} ${user.nom}`;

  if (action === "block") {
    return {
      user,
      endpoint: "/api/admin/block-user",
      description: "Blocage via vue globale membres",
      title: "Bloquer ce membre ?",
      message: `${fullName} perdra l'acces a son espace membre actif.`,
      confirmLabel: "Bloquer",
      tone: "danger",
      confirmationPhrase: MEMBER_BLOCK_CONFIRMATION,
    };
  }

  return {
    user,
    endpoint: "/api/admin/unblock-user",
    description: "Deblocage via vue globale membres",
    title: "Debloquer ce membre ?",
    message: `${fullName} retrouvera un parcours selon son statut de paiement.`,
    confirmLabel: "Debloquer",
    tone: "warning",
  };
}

function StatCard({ label, value, icon, tone = "default" }: { label: string; value: number; icon: AppIconName; tone?: "default" | "success" | "warning" | "danger" }) {
  const toneClass = {
    default: "text-slate-900",
    success: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-rose-700",
  }[tone];

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 ${toneClass}`}>
          <AppIcon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className={`text-xl font-bold ${toneClass}`}>{value}</p>
    </Card>
  );
}

function statusIcon(status: UserItem["statut"]): AppIconName {
  if (status === "actif") return "check";
  if (status === "bloque") return "lock";
  return "history";
}

function statusIconTone(status: UserItem["statut"]) {
  if (status === "actif") return "bg-emerald-100 text-emerald-700";
  if (status === "bloque") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

function humanizeStatus(status: UserItem["statut"]) {
  const labels: Record<UserItem["statut"], string> = {
    actif: "Actif",
    bloque: "Bloque",
  };

  return labels[status];
}

function humanizeCardStatus(user: UserItem) {
  if (isCardExpired(user.date_expiration)) {
    return "Expiree";
  }

  if (user.statut === "bloque" || !user.card_token || !user.date_expiration) {
    return "Invalide";
  }

  return "Valide";
}

function cardVariant(user: UserItem) {
  if (humanizeCardStatus(user) === "Valide") {
    return "success";
  }

  if (humanizeCardStatus(user) === "Expiree") {
    return "warning";
  }

  return "danger";
}

function formatCardExpiration(value: string | null) {
  if (!value) {
    return "Expiration non disponible";
  }

  return `Expire le ${new Date(value).toLocaleDateString("fr-FR")}`;
}

function isCardExpired(value: string | null) {
  return value !== null && new Date(value).getTime() < Date.now();
}
