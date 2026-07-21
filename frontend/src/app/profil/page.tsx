"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequest, getAuthToken } from "@/lib/api";
import { useStatusGuard } from "@/lib/use-status-guard";
import Button from "@/components/ui/Button";
import MemberPageShell, { MemberEmptyState, MemberMessage } from "@/components/MemberPageShell";
import { formFieldClassName } from "@/components/PublicAuthLayout";
import SessionGuardLoading from "@/components/SessionGuardLoading";

type Profile = {
  id: number;
  matricule: string;
  civilite: string | null;
  nom: string;
  prenom: string;
  date_naissance: string | null;
  email: string | null;
  telephone: string | null;
  numero_cni: string | null;
  adresse: string | null;
  pays_residence: string | null;
  region: string | null;
  departement: string | null;
  commune: string | null;
  statut: string;
};

type ProfileResponse = {
  user: Profile;
};

export default function ProfilPage() {
  const { ready } = useStatusGuard({ allowedStatuts: ["actif"] });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [civilite, setCivilite] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [telephone, setTelephone] = useState("");
  const [numeroCni, setNumeroCni] = useState("");
  const [adresse, setAdresse] = useState("");
  const [paysResidence, setPaysResidence] = useState("");
  const [region, setRegion] = useState("");
  const [departement, setDepartement] = useState("");
  const [commune, setCommune] = useState("");

  useEffect(() => {
    if (!ready) {
      return;
    }

    async function load() {
      const token = getAuthToken();
      if (!token) {
        setError("Token absent. Connectez-vous d'abord.");
        setLoading(false);
        return;
      }

      try {
        const result = await apiRequest<ProfileResponse>("/api/profile", { method: "GET" }, token);
        setProfile(result.user);
        setCivilite(result.user.civilite ?? "");
        setNom(result.user.nom ?? "");
        setPrenom(result.user.prenom ?? "");
        setDateNaissance(result.user.date_naissance ? result.user.date_naissance.slice(0, 10) : "");
        setTelephone(result.user.telephone ?? "");
        setNumeroCni(result.user.numero_cni ?? "");
        setAdresse(result.user.adresse ?? "");
        setPaysResidence(result.user.pays_residence ?? "");
        setRegion(result.user.region ?? "");
        setDepartement(result.user.departement ?? "");
        setCommune(result.user.commune ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [ready]);

  if (!ready) {
    return <SessionGuardLoading />;
  }

  async function refreshProfile() {
    const token = getAuthToken();
    const result = await apiRequest<ProfileResponse>("/api/profile", { method: "GET" }, token);
    setProfile(result.user);
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const token = getAuthToken();
      await apiRequest<ProfileResponse>(
        "/api/profile",
        {
          method: "PUT",
          body: JSON.stringify({
            civilite: civilite || null,
            nom,
            prenom,
            date_naissance: dateNaissance || null,
            telephone,
            numero_cni: numeroCni,
            adresse,
            pays_residence: paysResidence || null,
            region: region || null,
            departement: departement || null,
            commune: commune || null,
          }),
        },
        token,
      );
      setSuccess("Profil mis a jour.");
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise a jour impossible");
    }
  }

  return (
    <MemberPageShell
      eyebrow="Mon profil"
      title="Gerez vos informations personnelles"
      description="Mettez a jour vos informations de contact et d'identification."
    >
      {loading ? <MemberEmptyState>Chargement...</MemberEmptyState> : null}
      {error ? <MemberMessage tone="error">{error}</MemberMessage> : null}
      {success ? <MemberMessage tone="success">{success}</MemberMessage> : null}

      {profile ? (
        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Informations compte</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <Info label="Matricule" value={profile.matricule ?? "-"} />
              <Info label="Email" value={profile.email ?? "Email non renseigne"} />
              <Info label="Telephone" value={profile.telephone ?? "Telephone non renseigne"} />
              <Info label="Statut compte" value={profile.statut} />
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Modifier profil</h2>
            <form className="mt-5 space-y-4" onSubmit={submitProfile}>
              <select value={civilite} onChange={(e) => setCivilite(e.target.value)} className={formFieldClassName}>
                <option value="">Civilite</option>
                <option value="M">Monsieur</option>
                <option value="Mme">Madame</option>
                <option value="Mlle">Mademoiselle</option>
              </select>
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" className={formFieldClassName} />
                <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prenom" className={formFieldClassName} />
              </div>
              <input type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} className={formFieldClassName} />
              <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Telephone" className={formFieldClassName} />
              <input value={numeroCni} onChange={(e) => setNumeroCni(e.target.value)} placeholder="Numero CNI (10 a 15 chiffres)" className={formFieldClassName} />
              <input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Adresse" className={formFieldClassName} />
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={paysResidence} onChange={(e) => setPaysResidence(e.target.value)} placeholder="Pays de residence" className={formFieldClassName} />
                <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Region" className={formFieldClassName} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={departement} onChange={(e) => setDepartement(e.target.value)} placeholder="Departement" className={formFieldClassName} />
                <input value={commune} onChange={(e) => setCommune(e.target.value)} placeholder="Commune" className={formFieldClassName} />
              </div>
              <Button className="rounded-2xl px-5 py-3" type="submit">
                Enregistrer profil
              </Button>
            </form>
          </section>
        </div>
      ) : null}
    </MemberPageShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
