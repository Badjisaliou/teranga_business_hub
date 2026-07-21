"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { apiRequest, getAdminToken } from "@/lib/api";
import { useAdminGuard } from "@/lib/use-admin-guard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AppIcon, { AppIconName } from "@/components/ui/AppIcon";
import AdminGuardLoading from "@/components/AdminGuardLoading";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const MEMBER_BLOCK_CONFIRMATION = "BLOQUER";
const PIN_RESET_CONFIRMATION = "RESET PIN";

type MemberStatus = "actif" | "bloque";

type MemberDetailResponse = {
  user: {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
    email: string | null;
    telephone: string | null;
    numero_cni: string | null;
    adresse: string | null;
    role: "membre";
    statut: MemberStatus;
    date_adhesion: string | null;
    date_expiration: string | null;
    created_at: string;
    updated_at: string;
  };
  summary: {
    total_paiements_succes: number;
    cotisations_a_jour: number;
    cotisations_non_soldees: number;
    notifications_non_lues: number;
  };
  cotisations: Array<{
    id: number;
    mois: number;
    annee: number;
    montant_paye: number;
    statut: "non_paye" | "partiel" | "a_jour" | "en_retard";
    paiements: Array<{
      id: number;
      reference: string;
      montant: number;
      statut: string;
      methode_paiement: string;
      canal_paiement?: string | null;
      date_paiement: string | null;
    }>;
  }>;
  paiements: Array<{
    id: number;
    reference: string;
    type: "adhesion" | "cotisation";
    montant: number;
    methode_paiement: string;
    canal_paiement?: string | null;
    statut: "en_attente" | "succes" | "echoue";
    date_paiement: string | null;
    created_at: string;
  }>;
  notifications: Array<{
    id: number;
    message: string;
    type: string;
    statut: "lu" | "non_lu";
    date_envoi: string | null;
  }>;
  admin_actions: Array<{
    id: number;
    action: string;
    description: string | null;
    date_action: string | null;
    admin?: {
      nom: string;
      prenom: string;
      email: string | null;
    } | null;
  }>;
};

type PendingMemberAction = {
  endpoint?: string;
  kind?: "status" | "pin_reset";
  description: string;
  title: string;
  message: string;
  confirmLabel: string;
  tone: "default" | "danger" | "warning";
  confirmationPhrase?: string;
};

export default function AdminMemberDetailPage() {
  const { ready } = useAdminGuard({ requireAdminRole: true, allowedStatuts: ["actif"] });
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<MemberDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pinResetLink, setPinResetLink] = useState<string | null>(null);
  const [pinResetExpiry, setPinResetExpiry] = useState<string | null>(null);
  const [pinResetCopied, setPinResetCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingMemberAction | null>(null);

  useEffect(() => {
    if (!ready || !params.id) {
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
        const response = await apiRequest<MemberDetailResponse>(`/api/admin/membres/${params.id}`, { method: "GET" }, token);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [params.id, ready]);

  if (!ready) {
    return <AdminGuardLoading />;
  }

  async function mutateMember(endpoint: string, description: string, confirmationPhrase?: string) {
    if (!data) {
      return;
    }

    const token = getAdminToken();
    if (!token) {
      setError("Session admin invalide.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await apiRequest(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify({
            user_id: data.user.id,
            description,
            ...(confirmationPhrase ? { confirmation_phrase: confirmationPhrase } : {}),
          }),
        },
        token,
      );
      const refreshed = await apiRequest<MemberDetailResponse>(`/api/admin/membres/${data.user.id}`, { method: "GET" }, token);
      setData(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  }

  async function generatePinResetLink() {
    if (!data) {
      return;
    }

    const token = getAdminToken();
    if (!token) {
      setError("Session admin invalide.");
      return;
    }

    setBusy(true);
    setError(null);
    setPinResetLink(null);
    setPinResetExpiry(null);
    setPinResetCopied(false);
    try {
      const result = await apiRequest<{ reset_url: string; expires_at: string }>(
        "/api/admin/pin-reset-link",
        {
          method: "POST",
          body: JSON.stringify({
            user_id: data.user.id,
            description: "Lien de reinitialisation PIN genere depuis la fiche membre.",
            confirmation_phrase: PIN_RESET_CONFIRMATION,
          }),
        },
        token,
      );
      setPinResetLink(result.reset_url);
      setPinResetExpiry(result.expires_at);
      const refreshed = await apiRequest<MemberDetailResponse>(`/api/admin/membres/${data.user.id}`, { method: "GET" }, token);
      setData(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation du lien impossible");
    } finally {
      setBusy(false);
    }
  }

  async function copyPinResetLink() {
    if (!pinResetLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(pinResetLink);
      setPinResetCopied(true);
    } catch {
      setError("Copie automatique impossible. Selectionnez puis copiez le lien manuellement.");
    }
  }

  async function confirmPendingAction() {
    if (!pendingAction) {
      return;
    }

    if (pendingAction.kind === "pin_reset") {
      await generatePinResetLink();
      setPendingAction(null);
      return;
    }

    if (!pendingAction.endpoint) {
      return;
    }

    await mutateMember(pendingAction.endpoint, pendingAction.description, pendingAction.confirmationPhrase);
    setPendingAction(null);
  }

  return (
    <div className="min-h-screen bg-white px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href="/users" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
              Retour aux membres
            </Link>
            <h1 className="mt-2 text-3xl font-bold">
              {data ? `${data.user.prenom} ${data.user.nom}` : "Fiche membre"}
            </h1>
            {data ? <p className="mt-1 text-sm text-slate-500">{data.user.matricule}</p> : null}
          </div>

          {data ? (
            <div className="flex flex-wrap gap-2">
              {data.user.statut === "actif" ? (
                <Button type="button" variant="danger" disabled={busy} onClick={() => setPendingAction(actionForMember(data.user, "block"))}>
                  Bloquer
                </Button>
              ) : null}
              {data.user.statut === "bloque" ? (
                <Button type="button" disabled={busy} onClick={() => setPendingAction(actionForMember(data.user, "unblock"))}>
                  Debloquer
                </Button>
              ) : null}
              <Button type="button" variant="secondary" disabled={busy} onClick={() => setPendingAction(actionForMember(data.user, "pin_reset"))}>
                Lien reset PIN
              </Button>
            </div>
          ) : null}
        </div>

        {error ? <p className="text-red-500">{error}</p> : null}
        {pinResetLink ? (
          <Card>
            <h2 className="text-lg font-semibold">Lien de reinitialisation PIN</h2>
            <p className="mt-2 text-sm text-slate-600">
              Transmettez ce lien au membre apres verification de son identite. Il est unique et expire
              {pinResetExpiry ? ` le ${new Date(pinResetExpiry).toLocaleString("fr-FR")}` : ""}.
            </p>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm break-all text-slate-800">
              {pinResetLink}
            </div>
            <Button type="button" variant="secondary" className="mt-3" onClick={() => void copyPinResetLink()}>
              {pinResetCopied ? "Lien copie" : "Copier le lien"}
            </Button>
          </Card>
        ) : null}
        {loading ? <p className="text-slate-600">Chargement...</p> : null}

        {data ? (
          <>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full ${memberStatusTone(data.user.statut)}`}>
                    <AppIcon name={memberStatusIcon(data.user.statut)} className="h-5 w-5" />
                  </span>
                  <Badge variant={statusVariant(data.user.statut)}>{humanizeStatus(data.user.statut)}</Badge>
                </div>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <Info label="Email" value={data.user.email ?? "Email non renseigne"} icon="notification" />
                  <Info label="TÃ©lÃ©phone" value={data.user.telephone ?? "-"} icon="phone" />
                  <Info label="NumÃ©ro CNI" value={data.user.numero_cni ?? "-"} icon="card" />
                  <Info label="Adresse" value={data.user.adresse ?? "-"} icon="profile" />
                  <Info label="AdhÃ©sion" value={formatDate(data.user.date_adhesion)} icon="calendar" />
                  <Info label="Expiration" value={formatDate(data.user.date_expiration)} icon="alert" />
                </dl>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <SummaryCard label="Encaisse" value={formatCurrency(data.summary.total_paiements_succes)} icon="money" />
                <SummaryCard label="A jour" value={data.summary.cotisations_a_jour} icon="check" />
                <SummaryCard label="Non soldees" value={data.summary.cotisations_non_soldees} icon="alert" tone="warning" />
                <SummaryCard label="Notifications non lues" value={data.summary.notifications_non_lues} icon="notification" />
              </div>
            </div>

            <Card>
              <h2 className="mb-3 text-lg font-semibold">Cotisations</h2>
              {data.cotisations.length === 0 ? (
                <p className="text-sm text-slate-600">Aucune cotisation creee pour ce membre.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-2 pr-3">Periode</th>
                        <th className="py-2 pr-3">Montant paye</th>
                        <th className="py-2 pr-3">Statut</th>
                        <th className="py-2 pr-3">Paiements associes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.cotisations.map((cotisation) => (
                        <tr key={cotisation.id} className="border-b border-slate-100">
                          <td className="py-2 pr-3 font-semibold">
                            <span className="inline-flex items-center gap-2">
                              <AppIcon name="calendar" className="h-4 w-4 text-[color:var(--tbh-red)]" />
                              {formatMonth(cotisation.mois, cotisation.annee)}
                            </span>
                          </td>
                          <td className="py-2 pr-3">
                            <span className="inline-flex items-center gap-2">
                              <AppIcon name="money" className="h-4 w-4 text-[color:var(--tbh-red)]" />
                              {formatCurrency(cotisation.montant_paye)}
                            </span>
                          </td>
                          <td className="py-2 pr-3">
                            <span className="inline-flex items-center gap-2">
                              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${cotisationTone(cotisation.statut)}`}>
                                <AppIcon name={cotisationIcon(cotisation.statut)} className="h-4 w-4" />
                              </span>
                              <Badge variant={cotisationVariant(cotisation.statut)}>{humanizeCotisationStatus(cotisation.statut)}</Badge>
                            </span>
                          </td>
                          <td className="py-2 pr-3">{cotisation.paiements.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <div className="grid gap-4 lg:grid-cols-3">
              <HistoryCard title="Paiements" empty="Aucun paiement recent.">
                {data.paiements.map((paiement) => (
                  <li key={paiement.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex justify-between gap-2">
                      <p className="inline-flex items-center gap-2 font-semibold">
                        <AppIcon name="money" className="h-4 w-4 text-[color:var(--tbh-red)]" />
                        {formatCurrency(paiement.montant)}
                      </p>
                      <Badge variant={paymentVariant(paiement.statut)}>{humanizePaymentStatus(paiement.statut)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{paiement.reference}</p>
                    <p className="text-xs text-slate-500">
                      {humanizePaymentMethod(paiement.methode_paiement)}
                      {paiement.canal_paiement ? ` - ${humanizePaymentChannel(paiement.canal_paiement)}` : ""}
                      {" - "}
                      {formatDate(paiement.date_paiement ?? paiement.created_at)}
                    </p>
                  </li>
                ))}
              </HistoryCard>

              <HistoryCard title="Notifications" empty="Aucune notification recente.">
                {data.notifications.map((notification) => (
                  <li key={notification.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="mb-1 flex justify-between gap-2">
                      <p className="inline-flex items-center gap-2 font-semibold">
                        <AppIcon name="notification" className="h-4 w-4 text-[color:var(--tbh-red)]" />
                        {notification.type}
                      </p>
                      <Badge variant={notification.statut === "non_lu" ? "warning" : "neutral"}>{notification.statut}</Badge>
                    </div>
                    <p>{notification.message}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(notification.date_envoi)}</p>
                  </li>
                ))}
              </HistoryCard>

              <HistoryCard title="Actions administrateur" empty="Aucune action administrateur recente.">
                {data.admin_actions.map((action) => (
                  <li key={action.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="inline-flex items-center gap-2 font-semibold">
                      <AppIcon name={adminActionIcon(action.action)} className="h-4 w-4 text-[color:var(--tbh-red)]" />
                      {humanizeAdminAction(action.action)}
                    </p>
                    <p>{action.description ?? "Sans description"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(action.date_action)} - {action.admin ? `${action.admin.prenom} ${action.admin.nom}` : "Admin"}
                    </p>
                  </li>
                ))}
              </HistoryCard>
            </div>
          </>
        ) : null}
      </div>
      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction?.title ?? ""}
        description={pendingAction?.message ?? ""}
        confirmLabel={pendingAction?.confirmLabel ?? "Confirmer"}
        tone={pendingAction?.tone}
        loading={busy}
        requiredConfirmationText={pendingAction?.confirmationPhrase}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => void confirmPendingAction()}
        details={
          data ? (
            <div className="space-y-1">
              <p className="font-semibold text-slate-950">
                {data.user.prenom} {data.user.nom}
              </p>
              <p>Matricule: {data.user.matricule}</p>
              <p>Statut actuel: {humanizeStatus(data.user.statut)}</p>
            </div>
          ) : null
        }
      />
    </div>
  );
}

function actionForMember(user: MemberDetailResponse["user"], action: "block" | "unblock" | "pin_reset"): PendingMemberAction {
  const fullName = `${user.prenom} ${user.nom}`;

  if (action === "block") {
    return {
      endpoint: "/api/admin/block-user",
      description: "Blocage depuis fiche membre",
      title: "Bloquer ce membre ?",
      message: `${fullName} perdra l'acces a son espace membre actif.`,
      confirmLabel: "Bloquer",
      tone: "danger",
      confirmationPhrase: MEMBER_BLOCK_CONFIRMATION,
    };
  }

  if (action === "pin_reset") {
    return {
      kind: "pin_reset",
      description: "Lien de reinitialisation PIN genere depuis fiche membre",
      title: "Generer un lien reset PIN ?",
      message: `Un lien unique sera cree pour ${fullName}. Verifiez l'identite du membre avant de lui transmettre le lien.`,
      confirmLabel: "Generer le lien",
      tone: "warning",
      confirmationPhrase: PIN_RESET_CONFIRMATION,
    };
  }

  return {
    endpoint: "/api/admin/unblock-user",
    description: "Deblocage depuis fiche membre",
    title: "Debloquer ce membre ?",
    message: `${fullName} retrouvera un parcours selon son statut de paiement.`,
    confirmLabel: "Debloquer",
    tone: "warning",
  };
}

function Info({ label, value, icon }: { label: string; value: string; icon: AppIconName }) {
  return (
    <div>
      <dt className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-slate-500">
        <AppIcon name={icon} className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function SummaryCard({ label, value, icon, tone = "default" }: { label: string; value: number | string; icon: AppIconName; tone?: "default" | "warning" }) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 ${tone === "warning" ? "text-amber-600" : "text-[color:var(--tbh-red)]"}`}>
          <AppIcon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className={`mt-1 text-xl font-bold ${tone === "warning" ? "text-amber-600" : "text-slate-900"}`}>{value}</p>
    </Card>
  );
}

function HistoryCard({ title, empty, children }: { title: string; empty: string; children: ReactNode[] }) {
  return (
    <Card>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children.length === 0 ? <p className="text-sm text-slate-600">{empty}</p> : <ul className="space-y-2 text-sm text-slate-700">{children}</ul>}
    </Card>
  );
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("fr-FR");
}

function formatMonth(month: number, year: number) {
  return `${String(month).padStart(2, "0")}/${year}`;
}

function statusVariant(status: MemberStatus) {
  if (status === "actif") return "success";
  if (status === "bloque") return "danger";
  return "neutral";
}

function cotisationVariant(status: string) {
  if (status === "a_jour") return "success";
  if (status === "en_retard") return "danger";
  if (status === "partiel") return "warning";
  return "neutral";
}

function paymentVariant(status: string) {
  if (status === "succes") return "success";
  if (status === "echoue") return "danger";
  return "warning";
}

function humanizeStatus(value: string) {
  const labels: Record<string, string> = {
    actif: "Actif",
    bloque: "Bloque",
  };

  return labels[value] ?? value;
}

function humanizeCotisationStatus(value: string) {
  const labels: Record<string, string> = {
    non_paye: "Non paye",
    partiel: "Partiel",
    a_jour: "A jour",
    en_retard: "En retard",
  };

  return labels[value] ?? value;
}

function humanizePaymentMethod(value: string) {
  const labels: Record<string, string> = {
    wave: "Wave",
    orange_money: "Orange Money",
    dexpay: "DexPay",
  };

  return labels[value] ?? value;
}

function humanizePaymentChannel(value: string) {
  const labels: Record<string, string> = {
    wave: "Wave",
    orange_money: "Orange Money",
    free_money: "Free Money",
    wizall: "Wizall",
    card: "Carte bancaire",
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

function memberStatusIcon(status: MemberStatus): AppIconName {
  if (status === "actif") return "check";
  if (status === "bloque") return "lock";
  return "history";
}

function memberStatusTone(status: MemberStatus) {
  if (status === "actif") return "bg-emerald-100 text-emerald-700";
  if (status === "bloque") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

function cotisationIcon(status: string): AppIconName {
  if (status === "a_jour") return "check";
  if (status === "partiel") return "wallet";
  if (status === "en_retard") return "alert";
  return "calendar";
}

function cotisationTone(status: string) {
  if (status === "a_jour") return "bg-emerald-100 text-emerald-700";
  if (status === "partiel") return "bg-amber-100 text-amber-700";
  if (status === "en_retard") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

function humanizePaymentStatus(value: string) {
  const labels: Record<string, string> = {
    succes: "SuccÃ¨s",
    en_attente: "En attente",
    echoue: "Ã‰chouÃ©",
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
