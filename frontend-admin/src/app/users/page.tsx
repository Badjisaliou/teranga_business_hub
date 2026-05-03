"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest, getAdminToken } from "@/lib/api";
import { useAdminGuard } from "@/lib/use-admin-guard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type UserItem = {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  statut: "en_attente" | "attente_adhesion" | "actif" | "bloque" | "rejete";
  role: "membre";
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
    en_attente: number;
    attente_adhesion: number;
    bloques: number;
    rejetes: number;
  };
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

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("");
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
  }, [page, ready, search, statut, token]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  if (!ready) {
    return <div className="min-h-screen bg-white" />;
  }

  async function mutateUser(userId: number, endpoint: string, description: string) {
    try {
      setBusyUserId(userId);
      setError(null);

      await apiRequest(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify({ user_id: userId, description }),
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <StatCard label="Total membres" value={stats.total_membres} />
            <StatCard label="Actifs" value={stats.actifs} />
            <StatCard label="En attente" value={stats.en_attente} />
            <StatCard label="Attente adhesion" value={stats.attente_adhesion} />
            <StatCard label="Bloques" value={stats.bloques} />
            <StatCard label="Rejetes" value={stats.rejetes} />
          </div>
        ) : null}

        <Card>
          <form onSubmit={onSearchSubmit} className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher nom, prenom, email, telephone ou matricule"
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
              <option value="en_attente">En attente</option>
              <option value="attente_adhesion">Attente adhesion</option>
              <option value="actif">Actif</option>
              <option value="bloque">Bloque</option>
              <option value="rejete">Rejete</option>
            </select>
            <Button type="submit" variant="secondary">
              Rechercher
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
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3">Membre</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Inscription</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((user) => (
                  <tr key={user.id} className="border-t border-slate-200">
                    <td className="px-4 py-3">
                      <p className="font-semibold">
                        {user.prenom} {user.nom}
                      </p>
                      <p className="text-xs text-slate-500">{user.matricule}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{user.email}</p>
                      <p className="text-xs text-slate-500">{user.telephone ?? "-"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          user.statut === "actif"
                            ? "success"
                            : user.statut === "bloque"
                              ? "danger"
                              : user.statut === "en_attente"
                                ? "warning"
                                : "neutral"
                        }
                      >
                        {user.statut}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{new Date(user.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {user.statut === "en_attente" ? (
                          <>
                            <Button
                              type="button"
                              className="bg-emerald-500 text-slate-950 hover:opacity-90"
                              disabled={busyUserId === user.id}
                              onClick={() => void mutateUser(user.id, "/api/admin/validate-user", "Validation via vue globale membres")}
                            >
                              Valider
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              disabled={busyUserId === user.id}
                              onClick={() => void mutateUser(user.id, "/api/admin/reject-user", "Rejet via vue globale membres")}
                            >
                              Rejeter
                            </Button>
                          </>
                        ) : null}

                        {user.statut === "actif" ? (
                          <Button
                            type="button"
                            variant="danger"
                            disabled={busyUserId === user.id}
                            onClick={() => void mutateUser(user.id, "/api/admin/block-user", "Blocage via vue globale membres")}
                          >
                            Bloquer
                          </Button>
                        ) : null}

                        {user.statut === "bloque" ? (
                          <Button
                            type="button"
                            disabled={busyUserId === user.id}
                            onClick={() => void mutateUser(user.id, "/api/admin/unblock-user", "Deblocage via vue globale membres")}
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
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-3">
      <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}
