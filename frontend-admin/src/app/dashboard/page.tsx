"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest, clearAdminSession, getAdminToken } from "@/lib/api";
import { useAdminGuard } from "@/lib/use-admin-guard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AppIcon, { AppIconName } from "@/components/ui/AppIcon";
import AdminGuardLoading from "@/components/AdminGuardLoading";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const MEMBER_BLOCK_CONFIRMATION = "BLOQUER";

type AdminDashboardResponse = {
  kpis: {
    total_utilisateurs: number;
    utilisateurs_actifs: number;
    utilisateurs_bloques: number;
    paiements_en_attente: number;
    paiements_succes: number;
    total_encaisse: number;
    cotisations_non_soldees: number;
    membres_a_risque_blocage: number;
  };
  repartition_par_methode: Array<{ methode_paiement: string; total: number }>;
  actions_admin_recentes: Array<{ id: number; action: string; description: string | null }>;
  adhesion_applications_non_finalisees: Array<{
    id: number;
    public_id: string;
    prenom: string;
    nom: string;
    telephone: string;
    numero_cni: string;
    statut: "draft" | "payment_pending" | "failed" | "expired" | "paid";
    payment_reference: string | null;
    expires_at: string | null;
    created_at: string;
  }>;
  membres_a_bloquer_defaut_paiement: Array<{
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
    email: string | null;
    telephone: string | null;
    mois_non_soldes: number;
    details: string[];
  }>;
};

type RiskMember = AdminDashboardResponse["membres_a_bloquer_defaut_paiement"][number];

export default function DashboardPage() {
  const { ready } = useAdminGuard({ requireAdminRole: true, allowedStatuts: ["actif"] });
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [memberToBlock, setMemberToBlock] = useState<RiskMember | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!ready) {
      return;
    }

    const token = getAdminToken();
    if (!token) {
      return;
    }

    const result = await apiRequest<AdminDashboardResponse>("/api/admin/dashboard", { method: "GET" }, token);
    setData(result);
  }, [ready]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    async function load() {
      try {
        await loadDashboard();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    }

    void load();
  }, [loadDashboard, ready]);

  if (!ready) {
    return <AdminGuardLoading />;
  }

  async function blockForPaymentDefault(userId: number) {
    const target = data?.membres_a_bloquer_defaut_paiement.find((item) => item.id === userId);
    const token = getAdminToken();
    if (!token) {
      setError("Session admin invalide.");
      return;
    }

    setBusyUserId(userId);
    setError(null);
    try {
      await apiRequest(
        "/api/admin/block-user",
        {
          method: "POST",
          body: JSON.stringify({
            user_id: userId,
            description: `Blocage pour defaut de paiement (${target?.mois_non_soldes ?? "plusieurs"} mois non soldes).`,
            confirmation_phrase: MEMBER_BLOCK_CONFIRMATION,
          }),
        },
        token,
      );
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Blocage impossible");
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="min-h-screen bg-white px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <div className="flex items-center gap-2">
            <Link href="/users" className="rounded-lg bg-[color:var(--tbh-red)] px-3 py-2 text-sm font-semibold text-white">
              Gerer membres
            </Link>
            <Link href="/settings" className="rounded-lg border border-[color:var(--tbh-border)] px-3 py-2 text-sm">
              Paramètres métier
            </Link>
            <Link href="/finance" className="rounded-lg border border-[color:var(--tbh-border)] px-3 py-2 text-sm">
              Finance
            </Link>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                clearAdminSession();
                router.push("/login");
              }}
            >
              Déconnexion
            </Button>
          </div>
        </div>

        {error ? <p className="text-red-400">{error}</p> : null}
        {!data ? <p className="text-slate-600">Chargement...</p> : null}

        {data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <KpiCard title="Total membres" value={data.kpis.total_utilisateurs} icon="users" />
              <KpiCard title="Membres actifs" value={data.kpis.utilisateurs_actifs} icon="check" tone="success" />
              <KpiCard title="Paiements reussis" value={data.kpis.paiements_succes} icon="money" />
              <KpiCard title="Total encaisse" value={formatCurrency(data.kpis.total_encaisse)} icon="wallet" />
              <KpiCard title="Membres a risque" value={data.kpis.membres_a_risque_blocage} icon="alert" tone="warning" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <h2 className="mb-3 text-lg font-semibold">Repartition par methode</h2>
                {data.repartition_par_methode.length === 0 ? (
                  <p className="text-sm text-slate-600">Aucun paiement reussi pour le moment.</p>
                ) : (
                  <ul className="space-y-2 text-sm text-slate-700">
                    {data.repartition_par_methode.map((item) => (
                      <li key={item.methode_paiement} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                        <span className="inline-flex items-center gap-2 font-medium">
                          <AppIcon name={item.methode_paiement === "dexpay" ? "shield" : "wallet"} className="h-4 w-4 text-[color:var(--tbh-red)]" />
                          {humanizePaymentMethod(item.methode_paiement)}
                        </span>
                        <span>{item.total}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">Actions administrateur recentes</h2>
                  <span className="text-sm font-semibold text-slate-500">
                    Apercu recent
                  </span>
                </div>
                {data.actions_admin_recentes.length === 0 ? (
                  <p className="text-sm text-slate-600">Aucune action admin recente.</p>
                ) : (
                  <ul className="space-y-2 text-sm text-slate-700">
                    {data.actions_admin_recentes.slice(0, 10).map((item) => (
                      <li key={item.id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[color:var(--tbh-navy)]">
                          <AppIcon name={adminActionIcon(item.action)} className="h-4 w-4" />
                        </span>
                        <div>
                        <p className="font-semibold">{humanizeAdminAction(item.action)}</p>
                        <p>{item.description ?? "Sans description"}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <Card>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Inscriptions adhesion non finalisees</h2>
                  <p className="mt-1 text-sm text-slate-600">Suivi des parcours demarres sans membre actif cree.</p>
                </div>
                <Badge variant="warning">{data.adhesion_applications_non_finalisees.length}</Badge>
              </div>
              {data.adhesion_applications_non_finalisees.length === 0 ? (
                <p className="text-sm text-slate-600">Aucune inscription adhesion en attente de finalisation.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[760px] w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-2 pr-3">Demandeur</th>
                        <th className="py-2 pr-3">Contact</th>
                        <th className="py-2 pr-3">Statut</th>
                        <th className="py-2 pr-3">Reference</th>
                        <th className="py-2 pr-3">Expiration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.adhesion_applications_non_finalisees.map((application) => (
                        <tr key={application.id} className="border-b border-slate-100">
                          <td className="py-2 pr-3 font-semibold">
                            {application.prenom} {application.nom}
                            <p className="text-xs font-normal text-slate-500">{application.public_id}</p>
                          </td>
                          <td className="py-2 pr-3">
                            <p>{application.telephone}</p>
                            <p className="text-xs text-slate-500">CNI {application.numero_cni}</p>
                          </td>
                          <td className="py-2 pr-3">
                            <Badge variant={adhesionApplicationVariant(application.statut)}>
                              {humanizeAdhesionApplicationStatus(application.statut)}
                            </Badge>
                          </td>
                          <td className="py-2 pr-3">{application.payment_reference ?? "-"}</td>
                          <td className="py-2 pr-3">{formatDateTime(application.expires_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="border-amber-200 bg-amber-50">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Membres a risque de blocage</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Ces membres ont atteint le seuil de mois non soldes. Le blocage reste une decision admin explicite.
                  </p>
                </div>
                <Link href="/users?statut=actif" className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
                  Voir membres actifs
                </Link>
              </div>
              {data.membres_a_bloquer_defaut_paiement.length === 0 ? (
                <p className="text-sm text-slate-600">Aucun membre actif n&apos;a atteint le seuil de mois non soldes.</p>
              ) : (
                <ul className="grid gap-3 text-sm text-slate-700 lg:grid-cols-2">
                  {data.membres_a_bloquer_defaut_paiement.map((item) => (
                    <li key={item.id} className="rounded-lg border border-amber-200 bg-white p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            <Link href={`/users/${item.id}`} className="hover:text-[color:var(--tbh-red)]">
                              {item.prenom} {item.nom}
                            </Link>
                          </p>
                          <p className="text-xs text-slate-500">{item.matricule}</p>
                        </div>
                        <Badge variant="warning">
                          <span className="inline-flex items-center gap-1">
                            <AppIcon name="alert" className="h-3.5 w-3.5" />
                            Mois: {item.mois_non_soldes}
                          </span>
                        </Badge>
                      </div>
                      <p>{item.email ?? "Email non renseigne"}</p>
                      <p className="text-xs text-slate-500">{item.telephone ?? "Téléphone non renseigné"}</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {item.details.map((detail) => (
                          <span key={detail} className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                            {detail}
                          </span>
                        ))}
                      </div>
                      <Button
                        type="button"
                        className="mt-4 bg-amber-500 text-slate-950 hover:opacity-90"
                        onClick={() => setMemberToBlock(item)}
                        disabled={busyUserId === item.id}
                      >
                        {busyUserId === item.id ? "Blocage..." : "Bloquer pour defaut de paiement"}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        ) : null}
      </div>
      <ConfirmDialog
        open={memberToBlock !== null}
        title="Bloquer ce membre pour defaut de paiement ?"
        description="Cette action retirera l'acces membre actif tant que la situation n'est pas regularisee."
        confirmLabel="Bloquer"
        tone="danger"
        loading={memberToBlock ? busyUserId === memberToBlock.id : false}
        requiredConfirmationText={MEMBER_BLOCK_CONFIRMATION}
        onCancel={() => setMemberToBlock(null)}
        onConfirm={() => {
          if (!memberToBlock) {
            return;
          }

          void blockForPaymentDefault(memberToBlock.id).then(() => setMemberToBlock(null));
        }}
        details={
          memberToBlock ? (
            <div className="space-y-1">
              <p className="font-semibold text-slate-950">
                {memberToBlock.prenom} {memberToBlock.nom}
              </p>
              <p>Matricule: {memberToBlock.matricule}</p>
              <p>Mois non soldes: {memberToBlock.mois_non_soldes}</p>
            </div>
          ) : null
        }
      />
    </div>
  );
}

function KpiCard({ title, value, icon, tone = "default" }: { title: string; value: number | string; icon: AppIconName; tone?: "default" | "success" | "warning" }) {
  const toneClass = {
    default: "text-[color:var(--tbh-red)]",
    success: "text-emerald-700",
    warning: "text-amber-600",
  }[tone];

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-600">{title}</p>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-50 ${toneClass}`}>
          <AppIcon name={icon} className="h-5 w-5" />
        </span>
      </div>
      <p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p>
    </Card>
  );
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString("fr-FR") : "-";
}

function humanizeAdhesionApplicationStatus(value: AdminDashboardResponse["adhesion_applications_non_finalisees"][number]["statut"]) {
  const labels: Record<typeof value, string> = {
    draft: "Brouillon",
    payment_pending: "Paiement en attente",
    failed: "Echouee",
    expired: "Expiree",
    paid: "Payee",
  };

  return labels[value] ?? value;
}

function adhesionApplicationVariant(value: AdminDashboardResponse["adhesion_applications_non_finalisees"][number]["statut"]) {
  if (value === "payment_pending") return "warning";
  if (value === "failed" || value === "expired") return "danger";
  if (value === "paid") return "success";
  return "neutral";
}

function humanizePaymentMethod(value: string) {
  const labels: Record<string, string> = {
    wave: "Wave",
    orange_money: "Orange Money",
    dexpay: "DexPay",
  };

  return labels[value] ?? value;
}

function humanizeAdminAction(value: string) {
  const labels: Record<string, string> = {
    blocage: "Blocage",
    deblocage: "Deblocage",
    relance_paiement: "Relance paiement",
    pin_reset_link: "Reset PIN",
  };

  return labels[value] ?? value;
}

function adminActionIcon(value: string): AppIconName {
  if (value === "deblocage") return "check";
  if (value === "blocage") return "lock";
  if (value === "pin_reset_link") return "lock";
  if (value === "relance_paiement") return "notification";
  return "history";
}
