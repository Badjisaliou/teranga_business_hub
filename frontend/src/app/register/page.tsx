"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import Button from "@/components/ui/Button";
import PublicAuthLayout, { FeedbackMessage, formFieldClassName } from "@/components/PublicAuthLayout";
import PinInput from "@/components/ui/PinInput";

type AdhesionApplication = {
  public_id: string;
  statut: "draft" | "payment_pending" | "paid" | "failed" | "expired";
  montant_adhesion: number;
  payment_reference: string | null;
  payment_channel: string | null;
  failure_reason: string | null;
  expires_at: string | null;
};

type AdhesionStartResponse = {
  message: string;
  application: AdhesionApplication;
};

type AdhesionPaymentResponse = {
  message: string;
  application: AdhesionApplication;
  checkout_url: string | null;
};

const adhesionStorageKey = "teranga_pending_adhesion";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [civilite, setCivilite] = useState("M");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [paysResidence, setPaysResidence] = useState("Senegal");
  const [region, setRegion] = useState("");
  const [departement, setDepartement] = useState("");
  const [commune, setCommune] = useState("");
  const [numeroCni, setNumeroCni] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirmation, setPinConfirmation] = useState("");
  const [conditionsAcceptees, setConditionsAcceptees] = useState(false);
  const [canalPaiement, setCanalPaiement] = useState("wave");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const progress = useMemo(() => {
    if (step === 1) return "Identite";
    if (step === 2) return "Adresse et CNI";
    return "Paiement";
  }, [step]);

  function goNext() {
    setError(null);

    if (step === 1) {
      if (!prenom || !nom || !dateNaissance || !telephone || !/^[0-9]{6}$/.test(pin)) {
        setError("Veuillez renseigner votre identite, votre date de naissance et votre telephone WhatsApp.");
        return;
      }
      if (pin !== pinConfirmation) {
        setError("Les deux codes PIN ne correspondent pas.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!paysResidence || !region || !departement || !commune || !numeroCni) {
        setError("Veuillez completer votre adresse et votre numero CNI.");
        return;
      }
      if (!/^[0-9]{10,15}$/.test(numeroCni.replace(/\s+/g, ""))) {
        setError("Le numero CNI doit contenir entre 10 et 15 chiffres.");
        return;
      }
      setStep(3);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!conditionsAcceptees) {
      setError("Veuillez accepter les conditions d'adhesion.");
      return;
    }

    if (dateNaissance > maximumAdultBirthDate()) {
      setError("Vous devez avoir au moins 18 ans pour adhérer.");
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const start = await apiRequest<AdhesionStartResponse>("/api/adhesion/start", {
        method: "POST",
        body: JSON.stringify({
          civilite,
          prenom,
          nom,
          date_naissance: dateNaissance,
          telephone,
          email: email || null,
          pays_residence: paysResidence,
          region,
          departement,
          commune,
          numero_cni: numeroCni,
          pin,
          pin_confirmation: pinConfirmation,
          conditions_acceptees: conditionsAcceptees,
        }),
      });

      const payment = await apiRequest<AdhesionPaymentResponse>(`/api/adhesion/${start.application.public_id}/payment`, {
        method: "POST",
        body: JSON.stringify({
          canal_paiement: canalPaiement,
          idempotency_key: crypto.randomUUID(),
        }),
      });

      window.localStorage.setItem(
        adhesionStorageKey,
        JSON.stringify({
          public_id: payment.application.public_id,
          reference: payment.application.payment_reference,
          created_at: new Date().toISOString(),
        }),
      );

      if (payment.checkout_url) {
        window.location.href = payment.checkout_url;
        return;
      }

      router.push(`/register/success?application=${encodeURIComponent(payment.application.public_id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthLayout
      eyebrow="Adhesion"
      title="Inscription membre"
      description="Remplissez vos informations, puis payez l'adhesion pour recevoir votre matricule."
      variant="process"
      imageSrc="/hero-flyer-2.jpeg"
      imageAlt="Adhesion Teranga Business Hub"
      points={[
        "Inscription par etapes avec telephone WhatsApp obligatoire.",
        "Paiement adhesion de 10 000 FCFA via DexPay.",
        "Votre code PIN est choisi directement pendant l'inscription.",
      ]}
      footerLinks={[{ href: "/login", label: "J'ai deja un matricule" }]}
    >
      <div className="mb-5">
        <p className="text-sm font-semibold text-slate-500">Etape {step}/3</p>
        <h2 className="mt-1 text-xl font-bold text-slate-950">{progress}</h2>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2">
        {[1, 2, 3].map((item) => (
          <div key={item} className={`h-2 rounded-full ${item <= step ? "bg-[color:var(--tbh-red)]" : "bg-slate-200"}`} />
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {step === 1 ? (
          <>
            <select value={civilite} onChange={(event) => setCivilite(event.target.value)} className={formFieldClassName} required>
              <option value="M">Monsieur</option>
              <option value="Mme">Madame</option>
              <option value="Mlle">Mademoiselle</option>
            </select>
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="text" value={prenom} onChange={(event) => setPrenom(event.target.value)} placeholder="Prenom" className={formFieldClassName} required />
              <input type="text" value={nom} onChange={(event) => setNom(event.target.value)} placeholder="Nom" className={formFieldClassName} required />
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Date de naissance — adhésion réservée aux personnes de 18 ans ou plus</span>
              <input type="date" value={dateNaissance} onChange={(event) => setDateNaissance(event.target.value)} max={maximumAdultBirthDate()} className={formFieldClassName} required />
            </label>
            <input type="text" value={telephone} onChange={(event) => setTelephone(event.target.value)} placeholder="Telephone WhatsApp" className={formFieldClassName} required />
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email (optionnel)" className={formFieldClassName} />
            <PinInput value={pin} onChange={setPin} label="Choisissez votre code PIN" autoComplete="new-password" />
            <PinInput value={pinConfirmation} onChange={setPinConfirmation} label="Confirmez votre code PIN" autoComplete="new-password" />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <input type="text" value={paysResidence} onChange={(event) => setPaysResidence(event.target.value)} placeholder="Pays de residence" className={formFieldClassName} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="text" value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Region" className={formFieldClassName} required />
              <input type="text" value={departement} onChange={(event) => setDepartement(event.target.value)} placeholder="Departement" className={formFieldClassName} required />
            </div>
            <input type="text" value={commune} onChange={(event) => setCommune(event.target.value)} placeholder="Commune" className={formFieldClassName} required />
            <input type="text" value={numeroCni} onChange={(event) => setNumeroCni(event.target.value)} placeholder="Numero carte CNI (10 a 15 chiffres)" className={formFieldClassName} required />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Frais d'adhesion</p>
              <p className="mt-1 text-3xl font-black text-[color:var(--tbh-navy)]">10 000 FCFA</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Votre matricule sera disponible apres confirmation DexPay.</p>
            </div>

            <select value={canalPaiement} onChange={(event) => setCanalPaiement(event.target.value)} className={formFieldClassName} required>
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
              <option value="free_money">Free Money</option>
              <option value="wizall">Wizall</option>
              <option value="card">Carte bancaire</option>
            </select>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
              <input type="checkbox" checked={conditionsAcceptees} onChange={(event) => setConditionsAcceptees(event.target.checked)} className="mt-1 h-4 w-4" />
              <span>
                J’ai au moins 18 ans, je confirme l’exactitude des informations fournies et j’accepte les <Link href="/conditions-utilisation" target="_blank" className="font-bold text-[color:var(--tbh-red)] underline">conditions d’utilisation</Link> ainsi que le <Link href="/reglement-programme" target="_blank" className="font-bold text-[color:var(--tbh-red)] underline">règlement du programme</Link>. J’ai pris connaissance de la <Link href="/politique-confidentialite" target="_blank" className="font-bold text-[color:var(--tbh-red)] underline">politique de confidentialité</Link>. Je comprends que l’adhésion et les cotisations ne garantissent aucun financement.
              </span>
            </label>
          </>
        ) : null}

        {error ? <FeedbackMessage tone="error">{error}</FeedbackMessage> : null}
        {message ? <FeedbackMessage tone="success">{message}</FeedbackMessage> : null}

        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          {step > 1 ? (
            <Button type="button" variant="secondary" onClick={() => setStep((current) => (current === 3 ? 2 : 1))} disabled={loading} className="w-full rounded-xl px-5 py-3">
              Retour
            </Button>
          ) : null}
          {step < 3 ? (
            <Button type="button" onClick={goNext} className="w-full rounded-xl px-5 py-3">
              Continuer
            </Button>
          ) : (
            <Button type="submit" disabled={loading} className="w-full rounded-xl px-5 py-3">
              {loading ? "Redirection DexPay..." : "Payer et finaliser"}
            </Button>
          )}
        </div>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Vous avez deja un compte ?{" "}
        <Link href="/login" className="font-semibold text-[color:var(--tbh-red)]">
          Se connecter
        </Link>
      </p>
    </PublicAuthLayout>
  );
}

function maximumAdultBirthDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date.toISOString().slice(0, 10);
}
