"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { ProductFormValues } from "../../product-form-model";
import { LocalizedField } from "./form-fields";

export function SpecificationsEditor() {
  const t = useTranslations("admin.productForm");
  const tCommon = useTranslations("common");
  const { control } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "specifications" });

  return (
    <div className="space-y-4">
      {fields.length === 0 ? <p className="text-sm text-neutral-500">{t("noSpecifications")}</p> : null}
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-3 rounded-lg border border-neutral-200 p-4">
          <LocalizedField name={`specifications.${index}.label`} label={t("specLabel")} required compact />
          <LocalizedField name={`specifications.${index}.value`} label={t("specValue")} required compact />
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" icon={<Trash2 className="size-4" aria-hidden />} onClick={() => remove(index)}>
              {tCommon("remove")}
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        icon={<Plus className="size-4" aria-hidden />}
        onClick={() => append({ label: { en: "", fa: "" }, value: { en: "", fa: "" } })}
      >
        {t("addSpecification")}
      </Button>
    </div>
  );
}
