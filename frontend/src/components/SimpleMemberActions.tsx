import Link from "next/link";
import AppIcon, { AppIconName } from "@/components/ui/AppIcon";
import { getSupportHelpHref, isSupportWhatsAppConfigured } from "@/lib/support";

type SimpleAction = {
  href: string;
  label: string;
  icon: AppIconName;
  tone: string;
};

const actions: SimpleAction[] = [
  { href: "/cotisations/paiement", label: "Payer", icon: "wallet", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { href: "/carte", label: "Ma carte", icon: "card", tone: "bg-blue-50 text-[color:var(--tbh-navy)] border-blue-200" },
  { href: "/cotisations", label: "Mes mois", icon: "calendar", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  { href: "/notifications", label: "Messages", icon: "notification", tone: "bg-rose-50 text-[color:var(--tbh-red)] border-rose-200" },
];

export default function SimpleMemberActions() {
  const helpHref = getSupportHelpHref();
  const helpIsWhatsApp = isSupportWhatsAppConfigured();

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">Actions simples</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Les boutons les plus importants, avec de grands symboles.</p>
        </div>
        <a
          href={helpHref}
          target={helpIsWhatsApp ? "_blank" : undefined}
          rel={helpIsWhatsApp ? "noreferrer" : undefined}
          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
        >
          <AppIcon name="help" />
          Aide WhatsApp
        </a>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex min-h-32 flex-col items-center justify-center gap-3 rounded-[1.5rem] border px-3 py-4 text-center font-black transition hover:-translate-y-0.5 hover:bg-white ${action.tone}`}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <AppIcon name={action.icon} className="h-8 w-8" />
            </span>
            <span className="text-base">{action.label}</span>
          </Link>
        ))}
        <a
          href={helpHref}
          target={helpIsWhatsApp ? "_blank" : undefined}
          rel={helpIsWhatsApp ? "noreferrer" : undefined}
          className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-3 py-4 text-center font-black text-emerald-700 transition hover:-translate-y-0.5 hover:bg-white"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <AppIcon name="help" className="h-8 w-8" />
          </span>
          <span className="text-base">Aide</span>
        </a>
      </div>
    </section>
  );
}
