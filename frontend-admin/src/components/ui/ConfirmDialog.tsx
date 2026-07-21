import { useState, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AppIcon from "@/components/ui/AppIcon";

type ConfirmDialogTone = "default" | "danger" | "warning";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  details?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  tone?: ConfirmDialogTone;
  requiredConfirmationText?: string;
  confirmationLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  details,
  confirmLabel,
  cancelLabel = "Annuler",
  loading = false,
  tone = "default",
  requiredConfirmationText,
  confirmationLabel = "Confirmation explicite",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState("");

  if (!open) {
    return null;
  }

  const iconClass = {
    default: "bg-blue-50 text-[color:var(--tbh-navy)]",
    danger: "bg-rose-50 text-rose-700",
    warning: "bg-amber-50 text-amber-700",
  }[tone];
  const confirmationSatisfied = !requiredConfirmationText || confirmationInput === requiredConfirmationText;
  const cancel = () => {
    setConfirmationInput("");
    onCancel();
  };
  const confirm = () => {
    if (!confirmationSatisfied) {
      return;
    }

    setConfirmationInput("");
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-lg p-5 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
            <AppIcon name={tone === "danger" ? "alert" : "shield"} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 id="confirm-dialog-title" className="text-lg font-bold text-slate-950">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </div>

        {details ? <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">{details}</div> : null}

        {requiredConfirmationText ? (
          <label className="mt-4 block space-y-2 text-sm text-slate-700">
            <span className="font-semibold">{confirmationLabel}</span>
            <span className="block text-slate-600">
              Saisissez <strong>{requiredConfirmationText}</strong> pour confirmer.
            </span>
            <input
              value={confirmationInput}
              onChange={(event) => setConfirmationInput(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950"
              autoComplete="off"
            />
          </label>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={cancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={tone === "danger" ? "danger" : "primary"} onClick={confirm} disabled={loading || !confirmationSatisfied}>
            {loading ? "Traitement..." : confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
