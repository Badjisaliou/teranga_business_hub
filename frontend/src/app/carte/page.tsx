"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { apiRequest, getAuthToken } from "@/lib/api";
import { useStatusGuard } from "@/lib/use-status-guard";
import MemberPageShell, { MemberEmptyState, MemberMessage } from "@/components/MemberPageShell";
import SessionGuardLoading from "@/components/SessionGuardLoading";

type MemberCard = {
  matricule: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  numero_cni: string | null;
  statut: string;
  date_adhesion: string | null;
  date_expiration: string | null;
  card_issued_at?: string | null;
  verification_url?: string | null;
  is_valid: boolean;
};

type MemberCardResponse = {
  card: MemberCard;
};

const CARD_WIDTH = 1011;
const CARD_HEIGHT = 638;

export default function CarteMembrePage() {
  const { ready } = useStatusGuard({ allowedStatuts: ["actif"] });
  const [card, setCard] = useState<MemberCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
        const result = await apiRequest<MemberCardResponse>("/api/member-card", { method: "GET" }, token);
        setCard(result.card);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [ready]);

  useEffect(() => {
    if (!card || !canvasRef.current) {
      return;
    }

    let cancelled = false;
    const currentCard = card;

    async function renderCard() {
      try {
        setAssetsError(null);
        const logoUrl = await toDataUrl("/tbh-logo.png");
        const qrUrl = currentCard.verification_url ? qrCodeUrl(currentCard.verification_url, 240) : null;
        if (cancelled) {
          return;
        }

        const [logoImage, qrImage] = await Promise.all([
          loadImage(logoUrl),
          qrUrl ? loadImage(qrUrl).catch(() => null) : Promise.resolve(null),
        ]);
        if (cancelled) {
          return;
        }

        const context = canvasRef.current?.getContext("2d");
        if (!context) {
          throw new Error("Canvas non disponible.");
        }

        drawMemberCard(context, currentCard, logoImage, qrImage);
      } catch (err) {
        if (!cancelled) {
          setAssetsError(err instanceof Error ? err.message : "Impossible de preparer la carte.");
        }
      }
    }

    void renderCard();

    return () => {
      cancelled = true;
    };
  }, [card]);

  const cardFileBase = useMemo(() => {
    if (!card) {
      return "carte-membre-teranga-business-hub";
    }

    return `carte-membre-${slugify(`${card.prenom}-${card.nom}-${card.matricule}`)}`;
  }, [card]);

  if (!ready) {
    return <SessionGuardLoading />;
  }

  async function downloadCard() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    setDownloading(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1));
      if (!blob) {
        throw new Error("Telechargement impossible.");
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${cardFileBase}-recto.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setAssetsError(err instanceof Error ? err.message : "Telechargement impossible.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <MemberPageShell
      eyebrow="Carte de membre"
      title="Carte virtuelle"
      description="Votre Carte SIRA reprend l’identité visuelle officielle de Teranga Business Hub et intègre un QR code de vérification."
    >
      {loading ? <MemberEmptyState>Chargement...</MemberEmptyState> : null}
      {error ? <MemberMessage tone="error">{error}</MemberMessage> : null}
      {assetsError ? <MemberMessage tone="error">{assetsError}</MemberMessage> : null}

      {card ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" className="rounded-2xl px-5 py-3" onClick={() => void downloadCard()} disabled={downloading}>
              {downloading ? "Preparation du recto..." : "Telecharger la carte"}
            </Button>
            <p className="text-sm text-slate-600">Format ID-1 fixe, recto uniquement.</p>
          </div>

          {card.verification_url ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Verification publique</p>
              <a href={card.verification_url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-[color:var(--tbh-red)] hover:underline">
                {card.verification_url}
              </a>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="mx-auto w-full max-w-[860px]">
              <canvas
                ref={canvasRef}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                className="h-auto w-full rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
              />
            </div>
          </div>
        </div>
      ) : null}
    </MemberPageShell>
  );
}

function drawMemberCard(
  context: CanvasRenderingContext2D,
  card: MemberCard,
  logoImage: HTMLImageElement,
  qrImage: HTMLImageElement | null,
) {
  drawBaseBackground(context);
  const issuedAt = formatDate(card.card_issued_at ?? null) || new Date().toLocaleDateString("fr-FR");

  context.globalAlpha = 0.065;
  context.drawImage(logoImage, 410, 100, 480, 480);
  context.globalAlpha = 1;

  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(128, 118, 72, 0, Math.PI * 2);
  context.fill();
  context.drawImage(logoImage, 66, 56, 124, 124);
  context.fillStyle = "#d7192d";
  context.fillRect(220, 55, 4, 132);
  context.fillStyle = "#ffffff";
  context.font = "900 36px Arial";
  context.fillText("TERANGA", 250, 104);
  context.font = "800 25px Arial";
  context.fillText("Business Hub", 250, 139);
  context.font = "500 14px Arial";
  context.fillText("Ensemble, développons l'avenir.", 250, 169);

  context.textAlign = "right";
  context.font = "700 17px Arial";
  context.fillText("CARTE VIRTUELLE SIRA", CARD_WIDTH - 56, 72);
  drawContactless(context, CARD_WIDTH - 88, 108);
  context.textAlign = "left";

  const statusLabel = card.is_valid ? "VALIDE" : "EXPIREE";
  context.fillStyle = card.is_valid ? "#9bf2a8" : "#fecdd3";
  roundRect(context, CARD_WIDTH - 214, 174, 148, 38, 19);
  context.fill();
  context.fillStyle = "#0f172a";
  context.font = "800 17px Arial";
  context.fillText(statusLabel, CARD_WIDTH - 170, 199);

  context.fillStyle = "#e32438";
  context.font = "700 14px Arial";
  context.fillText("TITULAIRE", 58, 270);
  context.fillStyle = "#ffffff";
  context.font = "900 36px Arial";
  context.fillText(truncate(`${card.prenom} ${card.nom}`.trim().toUpperCase(), 27), 58, 310);

  context.strokeStyle = "rgba(255,255,255,0.9)";
  context.lineWidth = 2;
  roundRect(context, 58, 330, 330, 42, 21);
  context.stroke();
  context.fillStyle = "#ffffff";
  context.font = "700 15px Arial";
  context.fillText(`MEMBRE · ${card.matricule}`, 80, 357);

  const fields: Array<[string, string]> = [
    ["Numero CNI", card.numero_cni ?? "-"],
    ["Telephone", card.telephone ?? "-"],
    ["Adhesion", formatDate(card.date_adhesion)],
    ["Expiration", formatDate(card.date_expiration)],
    ["Statut", humanizeStatus(card.statut)],
    ["Emission", issuedAt],
  ];
  drawFieldsGrid(context, fields, 58, 395);

  context.fillStyle = "rgba(255,255,255,0.12)";
  roundRect(context, 750, 286, 200, 248, 28);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = "700 17px Arial";
  context.fillText("VÉRIFICATION QR", 774, 320);
  if (qrImage) {
    context.fillStyle = "#ffffff";
    roundRect(context, 779, 340, 142, 142, 14);
    context.fill();
    context.drawImage(qrImage, 787, 348, 126, 126);
  } else {
    drawVerificationMatrix(context, card.verification_url ?? card.matricule, 779, 340, 9, 15);
  }
  context.fillStyle = "#dbeafe";
  context.font = "600 12px Arial";
  context.fillText(truncate(card.matricule, 24), 779, 510);

  context.fillStyle = "rgba(255,255,255,0.86)";
  context.font = "600 13px Arial";
  context.fillText("SÉCURISÉE  •  VIRTUELLE  •  IMMÉDIATE", 58, CARD_HEIGHT - 32);
}

function drawBaseBackground(context: CanvasRenderingContext2D) {
  context.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const background = context.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  background.addColorStop(0, "#061b3e");
  background.addColorStop(0.55, "#08254e");
  background.addColorStop(1, "#061630");
  context.fillStyle = background;
  roundRect(context, 0, 0, CARD_WIDTH, CARD_HEIGHT, 36);
  context.fill();

  context.fillStyle = "#bd001c";
  context.beginPath();
  context.moveTo(390, CARD_HEIGHT);
  context.bezierCurveTo(700, 620, 890, 500, CARD_WIDTH, 260);
  context.lineTo(CARD_WIDTH, CARD_HEIGHT);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.85)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(390, CARD_HEIGHT - 2);
  context.bezierCurveTo(700, 618, 890, 498, CARD_WIDTH, 258);
  context.stroke();
}

function drawContactless(context: CanvasRenderingContext2D, x: number, y: number) {
  context.strokeStyle = "#ffffff";
  context.lineWidth = 5;
  context.lineCap = "round";
  for (let radius = 12; radius <= 34; radius += 11) {
    context.beginPath();
    context.arc(x, y, radius, -Math.PI / 3, Math.PI / 3);
    context.stroke();
  }
}

function drawFieldsGrid(context: CanvasRenderingContext2D, fields: Array<[string, string]>, x: number, y: number) {
  for (let index = 0; index < fields.length; index += 1) {
    const [label, value] = fields[index];
    const col = index % 2;
    const row = Math.floor(index / 2);
    const fieldX = x + col * 326;
    const fieldY = y + row * 76;

    context.fillStyle = "rgba(255,255,255,0.12)";
    roundRect(context, fieldX, fieldY, 292, 56, 18);
    context.fill();
    context.fillStyle = "#d0defa";
    context.font = "600 12px Arial";
    context.fillText(label.toUpperCase(), fieldX + 18, fieldY + 21);
    context.fillStyle = "#ffffff";
    context.font = "700 17px Arial";
    context.fillText(truncate(value, 25), fieldX + 18, fieldY + 43);
  }
}

function drawVerificationMatrix(
  context: CanvasRenderingContext2D,
  seed: string,
  x: number,
  y: number,
  cellSize: number,
  gridSize: number,
) {
  const bits = createVerificationBits(seed, gridSize * gridSize);
  let index = 0;

  for (let row = 0; row < gridSize; row += 1) {
    for (let col = 0; col < gridSize; col += 1) {
      const isFinder =
        (row < 3 && col < 3) ||
        (row < 3 && col >= gridSize - 3) ||
        (row >= gridSize - 3 && col < 3);

      const fill = isFinder ? "#ffffff" : bits[index] ? "#f8fafc" : "rgba(255,255,255,0.08)";
      context.fillStyle = fill;
      context.fillRect(x + col * cellSize, y + row * cellSize, cellSize - 1, cellSize - 1);
      index += 1;
    }
  }
}

function createVerificationBits(seed: string, size: number) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const bits: boolean[] = [];
  let state = hash >>> 0;
  for (let i = 0; i < size; i += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    bits.push((state & 1) === 1);
  }

  return bits;
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Impossible de charger une image de la carte."));
    image.src = src;
  });
}

async function toDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Impossible de charger un visuel pour la carte.");
  }

  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Conversion image impossible."));
      }
    };
    reader.onerror = () => reject(new Error("Conversion image impossible."));
    reader.readAsDataURL(blob);
  });
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("fr-FR");
}

function humanizeStatus(status: string) {
  const labels: Record<string, string> = {
    actif: "Actif",
    bloque: "Bloque",
  };

  return labels[status] ?? status;
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function qrCodeUrl(value: string, size: number) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(value)}`;
}
