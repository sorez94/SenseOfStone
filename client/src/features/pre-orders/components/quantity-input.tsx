"use client";

import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

interface QuantityInputProps {
  id: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  invalid?: boolean;
  describedBy?: string;
}

/** Stepper with an editable number field. */
export function QuantityInput({ id, value, min, max, onChange, invalid, describedBy }: QuantityInputProps) {
  const t = useTranslations("preOrder");
  const safe = Number.isFinite(value) ? value : min;
  const buttonStyle = "flex size-10 items-center justify-center text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-40";

  return (
    <div className="inline-flex items-center overflow-hidden rounded-md border border-neutral-300" dir="ltr">
      <button type="button" className={buttonStyle} onClick={() => onChange(Math.max(min, safe - 1))} disabled={safe <= min} aria-label={t("decrease")} aria-controls={id}>
        <Minus className="size-4" aria-hidden />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => onChange(event.target.valueAsNumber)}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="h-10 w-16 border-x border-neutral-300 text-center text-sm [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" className={buttonStyle} onClick={() => onChange(Math.min(max, safe + 1))} disabled={safe >= max} aria-label={t("increase")} aria-controls={id}>
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
