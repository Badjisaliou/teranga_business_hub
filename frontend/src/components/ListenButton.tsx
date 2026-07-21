"use client";

import { useState } from "react";
import AppIcon from "@/components/ui/AppIcon";

type ListenButtonProps = {
  text: string;
  className?: string;
};

export default function ListenButton({ text, className }: ListenButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  function listen() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    if (speaking) {
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={listen}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[color:var(--tbh-navy)] shadow-sm transition hover:border-[color:var(--tbh-red)] hover:text-[color:var(--tbh-red)] ${className ?? ""}`}
      title="Ecouter le message"
    >
      <AppIcon name="speaker" className="h-5 w-5" />
      {speaking ? "Arreter" : "Ecouter"}
    </button>
  );
}
