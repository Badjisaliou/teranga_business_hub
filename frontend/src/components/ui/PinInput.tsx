"use client";

import { ChangeEvent, useRef } from "react";

type PinInputProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  autoComplete?: "current-password" | "new-password" | "one-time-code";
  disabled?: boolean;
};

export default function PinInput({ value, onChange, label, autoComplete = "current-password", disabled = false }: PinInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function updateValue(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value.replace(/\D/g, "").slice(0, 6));
  }

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-800">{label}</span>
      <span className="relative block" onClick={() => inputRef.current?.focus()}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={updateValue}
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          autoComplete={autoComplete}
          aria-label={`${label}, 6 chiffres`}
          disabled={disabled}
          className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
          required
        />
        <span className="grid grid-cols-6 gap-2" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <span
              key={index}
              className={`flex aspect-square items-center justify-center rounded-xl border text-xl font-black transition sm:aspect-auto sm:h-14 ${
                index === value.length
                  ? "border-[color:var(--tbh-red)] ring-2 ring-red-100"
                  : "border-slate-300"
              } bg-white text-slate-950`}
            >
              {value[index] ? "•" : ""}
            </span>
          ))}
        </span>
      </span>
      <span className="mt-2 block text-xs text-slate-500">Saisissez exactement 6 chiffres.</span>
    </label>
  );
}
