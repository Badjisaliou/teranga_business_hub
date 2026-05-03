"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { apiRequest, getAuthToken } from "@/lib/api";
import { useStatusGuard } from "@/lib/use-status-guard";
import MemberPageShell, { MemberEmptyState, MemberMessage } from "@/components/MemberPageShell";

type MemberCard = {
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  adresse: string | null;
  numero_cni: string | null;
  statut: string;
  photo_profil: string | null;
  photo_profil_url?: string | null;
  date_adhesion: string | null;
  date_expiration: string | null;
  is_valid: boolean;
};

type MemberCardResponse = {
  card: MemberCard;
};

type CardSide = "front" | "back";

const CARD_WIDTH = 1011;
const CARD_HEIGHT = 638;

export default function CarteMembrePage() {
  const { ready } = useStatusGuard({ allowedStatuts: ["actif"] });
  const [card, setCard] = useState<MemberCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [downloadingSide, setDownloadingSide] = useState<CardSide | null>(null);
  const [activeSide, setActiveSide] = useState<CardSide>("front");
  const frontCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
    if (!card || !frontCanvasRef.current || !backCanvasRef.current) {
      return;
    }

    let cancelled = false;

    async function renderCard() {
      try {
        setAssetsError(null);

        const logoUrl = await toDataUrl("/tbh-logo.png");
        const photoUrl = card.photo_profil_url ? await toDataUrl(card.photo_profil_url) : null;
        if (cancelled) {
          return;
        }

        const [logoImage, photoImage] = await Promise.all([
          loadImage(logoUrl),
          photoUrl ? loadImage(photoUrl) : Promise.resolve(null),
        ]);
        if (cancelled) {
          return;
        }

        const frontContext = frontCanvasRef.current?.getContext("2d");
        const backContext = backCanvasRef.current?.getContext("2d");

        if (!frontContext || !backContext) {
          throw new Error("Canvas non disponible.");
        }

        drawFrontCard(frontContext, card, logoImage, photoImage);
        drawBackCard(backContext, card, logoImage);
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
    return <div className="min-h-screen bg-white" />;
  }

  async function downloadCard(side: CardSide) {
    const canvas = side === "front" ? frontCanvasRef.current : backCanvasRef.current;
    if (!canvas) {
      return;
    }

    setDownloadingSide(side);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1));
      if (!blob) {
        throw new Error("Telechargement impossible.");
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${cardFileBase}-${side === "front" ? "recto" : "verso"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setAssetsError(err instanceof Error ? err.message : "Telechargement impossible.");
    } finally {
      setDownloadingSide(null);
    }
  }

  return (
    <MemberPageShell
      eyebrow={"Carte de membre"}
      title={"Carte virtuelle premium"}
      description={
        "Votre carte adopte un format fixe type identite, avec recto et verso, logo, photo de profil et telechargement en image."
      }
    >
      {loading ? <MemberEmptyState>Chargement...</MemberEmptyState> : null}
      {error ? <MemberMessage tone="error">{error}</MemberMessage> : null}
      {assetsError ? <MemberMessage tone="error">{assetsError}</MemberMessage> : null}

      {card ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" className="rounded-2xl px-5 py-3" onClick={() => void downloadCard("front")} disabled={downloadingSide !== null}>
              {downloadingSide === "front" ? "Preparation du recto..." : "Telecharger le recto"}
            </Button>
            <Button type="button" variant="secondary" className="rounded-2xl px-5 py-3" onClick={() => void downloadCard("back")} disabled={downloadingSide !== null}>
              {downloadingSide === "back" ? "Preparation du verso..." : "Telecharger le verso"}
            </Button>
            <p className="text-sm text-slate-600">Format ID-1 fixe, adapte a une carte de membre standard.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveSide("front")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeSide === "front" ? "bg-[color:var(--tbh-red)] text-white" : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              Recto
            </button>
            <button
              type="button"
              onClick={() => setActiveSide("back")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeSide === "back" ? "bg-[color:var(--tbh-red)] text-white" : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              Verso
            </button>
          </div>

          <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="mx-auto w-full max-w-[860px]">
              <canvas
                ref={frontCanvasRef}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                className={`${activeSide === "front" ? "block" : "hidden"} h-auto w-full rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]`}
              />
              <canvas
                ref={backCanvasRef}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                className={`${activeSide === "back" ? "block" : "hidden"} h-auto w-full rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]`}
              />
            </div>
          </div>
        </div>
      ) : null}
    </MemberPageShell>
  );
}

function drawFrontCard(
  context: CanvasRenderingContext2D,
  card: MemberCard,
  logoImage: HTMLImageElement,
  photoImage: HTMLImageElement | null,
) {
  drawBaseBackground(context);
  const issuedAt = new Date().toLocaleDateString("fr-FR");

  context.drawImage(logoImage, 58, 56, 88, 88);
  context.fillStyle = "#ffffff";
  context.font = "700 22px Arial";
  context.fillText("TERANGA BUSINESS HUB", 164, 82);
  context.fillStyle = "#dbeafe";
  context.font = "700 16px Arial";
  context.fillText("CARTE DE MEMBRE", 164, 114);

  context.fillStyle = "#ffffff";
  context.font = "900 40px Arial";
  context.fillText(`${card.prenom} ${card.nom}`.trim(), 58, 208);

  context.fillStyle = "#dbeafe";
  context.font = "600 18px Arial";
  context.fillText(`Matricule : ${card.matricule}`, 58, 244);

  const statusLabel = card.is_valid ? "VALIDE" : "EXPIREE";
  context.fillStyle = card.is_valid ? "#9bf2a8" : "#fecdd3";
  roundRect(context, 58, 266, 156, 42, 21);
  context.fill();
  context.fillStyle = "#0f172a";
  context.font = "700 18px Arial";
  context.fillText(statusLabel, 95, 293);

  const photoX = CARD_WIDTH - 280;
  const photoY = 60;
  const photoW = 188;
  const photoH = 230;
  context.fillStyle = "rgba(255,255,255,0.92)";
  roundRect(context, photoX - 12, photoY - 12, photoW + 24, photoH + 24, 28);
  context.fill();

  if (photoImage) {
    drawCoverImage(context, photoImage, photoX, photoY, photoW, photoH, 24);
  } else {
    context.fillStyle = "#dbeafe";
    roundRect(context, photoX, photoY, photoW, photoH, 24);
    context.fill();
    context.fillStyle = "#35547c";
    context.font = "700 18px Arial";
    context.fillText("Photo", photoX + 66, photoY + 104);
    context.fillText("non fournie", photoX + 34, photoY + 132);
  }

  context.fillStyle = "#f8fafc";
  context.font = "700 18px Arial";
  context.fillText("IDENTIFICATION MEMBRE", 58, 348);

  const leftFields = [
    ["Email", card.email],
    ["Telephone", card.telephone ?? "-"],
    ["Adresse", card.adresse ?? "-"],
  ];

  const rightFields = [
    ["Numero CNI", card.numero_cni ?? "-"],
    ["Date adhesion", formatDate(card.date_adhesion)],
    ["Expiration", formatDate(card.date_expiration)],
  ];

  drawFieldsColumn(context, leftFields, 58, 370, 420);
  drawFieldsColumn(context, rightFields, 510, 370, 420);

  drawSignatureBlock(context, 710, 564, issuedAt);

  context.fillStyle = "rgba(255,255,255,0.86)";
  context.font = "600 13px Arial";
  context.fillText("Carte de membre virtuelle - usage interne TERANGA BUSINESS HUB", 58, CARD_HEIGHT - 38);
}

function drawBackCard(context: CanvasRenderingContext2D, card: MemberCard, logoImage: HTMLImageElement) {
  drawBaseBackground(context);
  const verificationSeed = `${card.matricule}|${card.email}|${card.numero_cni ?? ""}|${card.date_expiration ?? ""}`;

  context.globalAlpha = 0.08;
  context.drawImage(logoImage, CARD_WIDTH - 320, CARD_HEIGHT - 310, 240, 240);
  context.globalAlpha = 1;

  context.drawImage(logoImage, 58, 56, 72, 72);
  context.fillStyle = "#ffffff";
  context.font = "800 24px Arial";
  context.fillText("TERANGA BUSINESS HUB", 148, 84);
  context.fillStyle = "#dbeafe";
  context.font = "600 15px Arial";
  context.fillText("VERSO - INFORMATIONS MEMBRE", 148, 112);

  context.fillStyle = "rgba(255,255,255,0.1)";
  roundRect(context, 58, 150, CARD_WIDTH - 116, 186, 28);
  context.fill();

  context.fillStyle = "#ffffff";
  context.font = "700 18px Arial";
  context.fillText("Informations generales", 84, 188);

  const infoRows = [
    ["Nom complet", `${card.prenom} ${card.nom}`.trim()],
    ["Numero de membre", card.matricule],
    ["Statut du compte", humanizeStatus(card.statut)],
    ["Validite de la carte", card.is_valid ? "Carte valide" : "Carte a renouveler"],
    ["Telephone", card.telephone ?? "-"],
    ["Email", card.email],
  ];

  let rowY = 226;
  for (const [label, value] of infoRows) {
    context.fillStyle = "#dbeafe";
    context.font = "600 14px Arial";
    context.fillText(label, 84, rowY);
    context.fillStyle = "#ffffff";
    context.font = "700 18px Arial";
    context.fillText(truncate(value, 56), 290, rowY);
    rowY += 28;
  }

  context.fillStyle = "rgba(255,255,255,0.1)";
  roundRect(context, 58, 364, CARD_WIDTH - 116, 178, 28);
  context.fill();

  context.fillStyle = "#ffffff";
  context.font = "700 18px Arial";
  context.fillText("Mentions", 84, 402);
  context.fillStyle = "#dbeafe";
  context.font = "600 15px Arial";
  wrapText(
    context,
    "Cette carte identifie le membre au sein de TERANGA BUSINESS HUB. Elle reste personnelle et ne peut etre utilisee qu'en lien avec les activites et services de la structure.",
    84,
    436,
    CARD_WIDTH - 168,
    26,
  );

  context.fillStyle = "#fecdd3";
  context.font = "700 15px Arial";
  context.fillText("En cas de perte, merci de contacter la structure.", 84, 510);

  context.fillStyle = "rgba(255,255,255,0.1)";
  roundRect(context, 736, 382, 170, 128, 22);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = "700 16px Arial";
  context.fillText("Code de verification", 752, 410);
  drawVerificationMatrix(context, verificationSeed, 754, 424, 9, 12);
  context.fillStyle = "#dbeafe";
  context.font = "600 12px Arial";
  context.fillText(card.matricule, 754, 534);

  context.fillStyle = "rgba(255,255,255,0.86)";
  context.font = "600 13px Arial";
  context.fillText("Carte de membre - format numerique standard", 58, CARD_HEIGHT - 38);
}

function drawBaseBackground(context: CanvasRenderingContext2D) {
  context.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const background = context.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  background.addColorStop(0, "#10284d");
  background.addColorStop(0.5, "#173a6d");
  background.addColorStop(1, "#224f91");
  context.fillStyle = background;
  roundRect(context, 0, 0, CARD_WIDTH, CARD_HEIGHT, 36);
  context.fill();

  const glow = context.createRadialGradient(140, 90, 0, 140, 90, 260);
  glow.addColorStop(0, "rgba(239,74,92,0.35)");
  glow.addColorStop(1, "rgba(239,74,92,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  context.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(context, 36, 36, CARD_WIDTH - 72, CARD_HEIGHT - 72, 28);
  context.fill();
}

function drawFieldsColumn(
  context: CanvasRenderingContext2D,
  fields: Array<[string, string]>,
  x: number,
  y: number,
  width: number,
) {
  let offsetY = y;
  for (const [label, value] of fields) {
    context.fillStyle = "rgba(255,255,255,0.12)";
    roundRect(context, x, offsetY, width, 54, 18);
    context.fill();

    context.fillStyle = "#d0defa";
    context.font = "600 13px Arial";
    context.fillText(label.toUpperCase(), x + 18, offsetY + 20);

    context.fillStyle = "#ffffff";
    context.font = "700 18px Arial";
    context.fillText(truncate(value, 34), x + 18, offsetY + 40);
    offsetY += 66;
  }
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.save();
  roundRect(context, x, y, width, height, radius);
  context.clip();

  const scale = Math.max(width / image.width, height / image.height);
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;
  const dx = x + (width - scaledWidth) / 2;
  const dy = y + (height - scaledHeight) / 2;

  context.drawImage(image, dx, dy, scaledWidth, scaledHeight);
  context.restore();
}

function drawSignatureBlock(context: CanvasRenderingContext2D, x: number, y: number, issuedAt: string) {
  context.fillStyle = "rgba(255,255,255,0.12)";
  roundRect(context, x - 8, y - 40, 238, 92, 20);
  context.fill();

  context.fillStyle = "#dbeafe";
  context.font = "600 12px Arial";
  context.fillText(`Date d'emission : ${issuedAt}`, x + 4, y - 14);

  context.strokeStyle = "rgba(255,255,255,0.75)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x + 4, y + 6);
  context.bezierCurveTo(x + 34, y - 26, x + 62, y + 28, x + 90, y - 4);
  context.bezierCurveTo(x + 110, y - 24, x + 138, y + 18, x + 172, y - 10);
  context.bezierCurveTo(x + 188, y - 22, x + 202, y - 6, x + 220, y - 2);
  context.stroke();

  context.strokeStyle = "rgba(239,74,92,0.85)";
  context.lineWidth = 3;
  context.beginPath();
  context.ellipse(x + 174, y + 6, 42, 24, -0.18, 0, Math.PI * 2);
  context.stroke();
  context.font = "700 11px Arial";
  context.fillStyle = "#ffffff";
  context.fillText("Cachet TBH", x + 145, y + 10);
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

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let offsetY = y;

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (context.measureText(nextLine).width > maxWidth) {
      context.fillText(line, x, offsetY);
      line = word;
      offsetY += lineHeight;
    } else {
      line = nextLine;
    }
  }

  if (line) {
    context.fillText(line, x, offsetY);
  }
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
    en_attente: "En attente",
    attente_adhesion: "Attente adhesion",
    rejete: "Rejete",
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
