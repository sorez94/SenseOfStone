"use client";

import { useTranslations } from "next-intl";
import { get, useFormContext, type FieldPathByValue } from "react-hook-form";
import { Input, Textarea } from "@/components/ui/form-controls";
import { FormField } from "@/components/ui/form-field";
import type { ProductFormValues } from "../../product-form-model";

type LocalizedPath = FieldPathByValue<ProductFormValues, { en: string; fa: string }>;
type NumberPath = FieldPathByValue<ProductFormValues, number | null> | FieldPathByValue<ProductFormValues, number>;

/** English + Persian inputs for one LocalizedText field. Persian input is RTL. */
export function LocalizedField({
  name,
  label,
  multiline = false,
  required = false,
  compact = false,
}: {
  name: LocalizedPath;
  label: string;
  multiline?: boolean;
  required?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("common");
  const { register, formState } = useFormContext<ProductFormValues>();
  const id = name.replace(/\./g, "-");
  const Control = multiline ? Textarea : Input;

  return (
    <div className={compact ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : "grid grid-cols-1 gap-4 md:grid-cols-2"}>
      <FormField
        id={`${id}-en`}
        labelStyle="normal"
        label={`${label} (${t("english")})`}
        required={required}
        error={get(formState.errors, `${name}.en`)?.message}
      >
        <Control appearance="boxed" dir="ltr" lang="en" {...(multiline ? { rows: 4 } : {})} {...register(`${name}.en`)} />
      </FormField>
      <FormField id={`${id}-fa`} labelStyle="normal" label={`${label} (${t("persian")})`} error={get(formState.errors, `${name}.fa`)?.message}>
        <Control appearance="boxed" dir="rtl" lang="fa" {...(multiline ? { rows: 4 } : {})} {...register(`${name}.fa`)} />
      </FormField>
    </div>
  );
}

const toNullableNumber = (value: unknown) => (value === "" || value === null || value === undefined ? null : Number(value));

export function NumberField({
  name,
  label,
  required,
  nullable = true,
  step,
  hint,
}: {
  name: NumberPath;
  label: string;
  required?: boolean;
  nullable?: boolean;
  step?: number;
  hint?: string;
}) {
  const { register, formState } = useFormContext<ProductFormValues>();
  return (
    <FormField id={`field-${name.replace(/\./g, "-")}`} labelStyle="normal" label={label} required={required} hint={hint} error={get(formState.errors, name)?.message}>
      <Input
        type="number"
        inputMode="numeric"
        appearance="boxed"
        dir="ltr"
        step={step}
        {...register(name, { setValueAs: nullable ? toNullableNumber : (v: unknown) => (v === "" ? Number.NaN : Number(v)) })}
      />
    </FormField>
  );
}
