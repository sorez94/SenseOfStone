"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { get, useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox, Input } from "@/components/ui/form-controls";
import type { ProductFormValues } from "../../product-form-model";
import { LocalizedField } from "./form-fields";

/** Editor for product options (e.g. Size, Finish) and their values with price deltas. */
export function OptionsEditor() {
  const t = useTranslations("admin.productForm");
  const { control } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "options" });

  return (
    <div className="space-y-4">
      {fields.length === 0 ? <p className="text-sm text-neutral-500">{t("noOptions")}</p> : null}
      {fields.map((field, index) => (
        <fieldset key={field.id} className="space-y-4 rounded-lg border border-neutral-200 p-4">
          <legend className="px-1 text-sm text-neutral-700">#{index + 1}</legend>
          <LocalizedField name={`options.${index}.name`} label={t("optionName")} required compact />
          <div className="flex items-center justify-between">
            <OptionRequiredToggle index={index} />
            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" icon={<Trash2 className="size-4" aria-hidden />} onClick={() => remove(index)}>
              {t("removeOption")}
            </Button>
          </div>
          <OptionValuesEditor optionIndex={index} />
        </fieldset>
      ))}
      <Button
        variant="outline"
        icon={<Plus className="size-4" aria-hidden />}
        onClick={() => append({ name: { en: "", fa: "" }, required: true, values: [{ label: { en: "", fa: "" }, priceDelta: 0 }] })}
      >
        {t("addOption")}
      </Button>
    </div>
  );
}

function OptionRequiredToggle({ index }: { index: number }) {
  const t = useTranslations("admin.productForm");
  const { register } = useFormContext<ProductFormValues>();
  return <Checkbox id={`option-${index}-required`} label={t("optionRequired")} {...register(`options.${index}.required`)} />;
}

function OptionValuesEditor({ optionIndex }: { optionIndex: number }) {
  const t = useTranslations("admin.productForm");
  const tCommon = useTranslations("common");
  const { control, register, formState } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: `options.${optionIndex}.values` });
  const listError = get(formState.errors, `options.${optionIndex}.values`)?.root?.message ?? get(formState.errors, `options.${optionIndex}.values`)?.message;

  return (
    <div>
      <p className="mb-2 text-sm text-neutral-700">{t("optionValues")}</p>
      <ul className="space-y-2">
        {fields.map((field, valueIndex) => {
          const base = `options.${optionIndex}.values.${valueIndex}` as const;
          const labelError = get(formState.errors, `${base}.label.en`)?.message;
          return (
            <li key={field.id} className="grid grid-cols-1 gap-2 rounded-md bg-neutral-50 p-2 sm:grid-cols-[1fr_1fr_10rem_auto] sm:items-start">
              <div>
                <Input appearance="boxed" dir="ltr" placeholder={`${t("valueLabel")} (EN)`} aria-label={`${t("valueLabel")} (${tCommon("english")})`} aria-invalid={Boolean(labelError) || undefined} {...register(`${base}.label.en`)} />
                {labelError ? <p className="mt-1 text-xs text-red-600">{labelError}</p> : null}
              </div>
              <Input appearance="boxed" dir="rtl" placeholder={`${t("valueLabel")} (FA)`} aria-label={`${t("valueLabel")} (${tCommon("persian")})`} {...register(`${base}.label.fa`)} />
              <Input
                appearance="boxed"
                type="number"
                dir="ltr"
                step={100000}
                aria-label={t("priceDelta")}
                title={t("priceDelta")}
                {...register(`${base}.priceDelta`, { setValueAs: (v: unknown) => (v === "" ? 0 : Number(v)) })}
              />
              <Button variant="ghost" size="icon" className="size-10 text-red-600 hover:bg-red-50" aria-label={t("removeValue")} onClick={() => remove(valueIndex)}>
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </li>
          );
        })}
      </ul>
      {listError ? (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {listError}
        </p>
      ) : null}
      <Button variant="ghost" size="sm" className="mt-2" icon={<Plus className="size-4" aria-hidden />} onClick={() => append({ label: { en: "", fa: "" }, priceDelta: 0 })}>
        {t("addValue")}
      </Button>
    </div>
  );
}
