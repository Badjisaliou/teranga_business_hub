"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequest, getAuthToken } from "@/lib/api";
import { useStatusGuard } from "@/lib/use-status-guard";
import Button from "@/components/ui/Button";
import MemberPageShell, { MemberEmptyState, MemberMessage } from "@/components/MemberPageShell";
import { formFieldClassName } from "@/components/PublicAuthLayout";

type Profile = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  numero_cni: string | null;
  adresse: string | null;
  photo_profil: string | null;
  photo_profil_url?: string | null;
  kyc_statut: string;
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
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [numeroCni, setNumeroCni] = useState("");
  const [adresse, setAdresse] = useState("");
  const [photoProfilFile, setPhotoProfilFile] = useState<File | null>(null);

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
        setNom(result.user.nom ?? "");
        setPrenom(result.user.prenom ?? "");
        setTelephone(result.user.telephone ?? "");
        setNumeroCni(result.user.numero_cni ?? "");
        setAdresse(result.user.adresse ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [ready]);

  if (!ready) {
    return <div className="min-h-screen bg-white" />;
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
        { method: "PUT", body: JSON.stringify({ nom, prenom, telephone, numero_cni: numeroCni, adresse }) },
        token,
      );
      setSuccess("Profil mis a jour.");
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise a jour impossible");
    }
  }

  async function submitKyc(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!photoProfilFile) {
      setError("Selectionnez une photo de profil.");
      return;
    }

    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append("photo_profil", photoProfilFile);
      await apiRequest<ProfileResponse>("/api/profile/kyc", { method: "POST", body: formData }, token);
      setPhotoProfilFile(null);
      setSuccess("Photo de profil mise a jour.");
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise a jour KYC impossible");
    }
  }

  async function deleteProfilePhoto() {
    setError(null);
    setSuccess(null);
    setDeletingPhoto(true);

    try {
      const token = getAuthToken();
      await apiRequest("/api/profile/kyc/photo_profil", { method: "DELETE" }, token);
      setSuccess("Photo de profil supprimee.");
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setDeletingPhoto(false);
      setConfirmDelete(false);
    }
  }

  return (
    <MemberPageShell
      eyebrow="Mon profil"
      title="Gerez vos informations personnelles"
      description="Mettez a jour vos informations de contact et votre photo de profil dans un espace plus clair et plus coherent visuellement."
    >
      {loading ? <MemberEmptyState>Chargement...</MemberEmptyState> : null}
      {error ? <MemberMessage tone="error">{error}</MemberMessage> : null}
      {success ? <MemberMessage tone="success">{success}</MemberMessage> : null}

      {profile ? (
        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Informations compte</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <Info label="Email" value={profile.email} />
              <Info label="Statut compte" value={profile.statut} />
              <Info label="Statut KYC" value={profile.kyc_statut} />
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Modifier profil</h2>
            <form className="mt-5 space-y-4" onSubmit={submitProfile}>
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" className={formFieldClassName} />
                <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prenom" className={formFieldClassName} />
              </div>
              <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Telephone" className={formFieldClassName} />
              <input value={numeroCni} onChange={(e) => setNumeroCni(e.target.value)} placeholder="Numero CNI" className={formFieldClassName} />
              <input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Adresse" className={formFieldClassName} />
              <Button className="rounded-2xl px-5 py-3" type="submit">
                Enregistrer profil
              </Button>
            </form>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-sm xl:col-span-2">
            <h2 className="text-2xl font-bold text-slate-950">Photo de profil (KYC)</h2>
            <form className="mt-5 space-y-4" onSubmit={submitKyc}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoProfilFile(e.target.files?.[0] ?? null)}
                className={`${formFieldClassName} file:mr-3 file:rounded-full file:border-0 file:bg-[color:var(--tbh-red)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white`}
              />
              <Button className="rounded-2xl px-5 py-3" type="submit">
                Enregistrer photo
              </Button>
            </form>

            <div className="mt-6">
              {profile.photo_profil_url ? (
                <div className="max-w-xs space-y-3">
                  <a href={profile.photo_profil_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-[1.25rem] border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={profile.photo_profil_url} alt="Photo profil" className="h-52 w-full object-cover" />
                  </a>
                  <Button type="button" onClick={() => setConfirmDelete(true)} disabled={deletingPhoto} variant="danger" className="w-full rounded-2xl px-5 py-3">
                    {deletingPhoto ? "Suppression..." : "Supprimer photo"}
                  </Button>
                </div>
              ) : (
                <div className="flex h-52 max-w-xs items-center justify-center rounded-[1.25rem] border border-dashed border-slate-300 text-sm text-slate-500">
                  Aucune photo
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-950">Confirmer la suppression</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">Vous allez supprimer votre photo de profil. Cette action est irreversible.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" className="rounded-2xl" onClick={() => setConfirmDelete(false)} disabled={deletingPhoto}>
                Annuler
              </Button>
              <Button type="button" variant="danger" className="rounded-2xl" onClick={() => void deleteProfilePhoto()} disabled={deletingPhoto}>
                {deletingPhoto ? "Suppression..." : "Supprimer"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </MemberPageShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
