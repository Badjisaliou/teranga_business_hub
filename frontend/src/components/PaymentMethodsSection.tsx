import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const additionalMethods = [
  { name: "Free Money", mark: "Free", className: "bg-red-600 text-white" },
  { name: "Wizall Money", mark: "W", className: "bg-violet-700 text-white" },
  { name: "Carte bancaire", mark: "VISA / Mastercard", className: "bg-slate-900 text-white" },
] as const;

export function PaymentMethodsSection() {
  return <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
    <div className="max-w-3xl"><p className="text-sm font-black uppercase tracking-[.18em] text-[color:var(--tbh-red)]">Paiements sécurisés avec DexPay</p><h2 className="mt-3 text-3xl font-black sm:text-5xl">Choisissez le moyen qui vous convient.</h2><p className="mt-5 leading-8 text-slate-600">L’adhésion et les cotisations peuvent être réglées depuis le parcours sécurisé de l’espace membre. Les moyens actuellement proposés par l’intégration TBH sont présentés ci-dessous.</p></div>
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
      <PaymentMethod name="Wave"><Image src="/payments/wave-official.png" alt="Logo officiel Wave" width={262} height={101} className="h-auto w-36 object-contain" /></PaymentMethod>
      <PaymentMethod name="Orange Money"><Image src="/payments/orange-money-official.jpg" alt="Logo officiel Orange Money" width={300} height={255} className="h-20 w-auto rounded-lg object-contain" /></PaymentMethod>
      {additionalMethods.map((method) => <PaymentMethod key={method.name} name={method.name}><span className={`inline-flex min-h-16 min-w-16 items-center justify-center rounded-xl px-4 text-center text-sm font-black ${method.className}`}>{method.mark}</span></PaymentMethod>)}
    </div>
    <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600"><p><strong className="text-slate-900">Disponibilité :</strong> le moyen proposé est confirmé au moment du paiement selon le pays, la configuration du compte marchand et la disponibilité technique de DexPay. DexPay annonce également MTN Money et Moov Money dans certains marchés ; ces deux canaux ne sont pas encore activés dans le parcours TBH.</p><p className="mt-2">Les éventuels frais sont affichés dans le parcours DexPay avant la confirmation de l’opération.</p></div>
    <Link href="/login" className="mt-7 inline-flex rounded-full bg-[color:var(--tbh-navy)] px-6 py-3 font-bold text-white">Accéder à mon espace</Link>
  </section>;
}

function PaymentMethod({ name, children }: { name: string; children: ReactNode }) {
  return <article className="flex min-h-52 flex-col items-center justify-between rounded-[1.75rem] border border-slate-200 bg-white p-6 text-center shadow-sm"><div className="flex h-24 items-center justify-center">{children}</div><div><h3 className="text-lg font-black text-[color:var(--tbh-navy)]">{name}</h3><p className="mt-2 text-xs text-slate-500">Disponible via DexPay</p></div></article>;
}
