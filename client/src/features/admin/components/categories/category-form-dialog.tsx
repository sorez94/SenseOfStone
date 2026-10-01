"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/form-controls";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/states";
import type { Category, CategoryInput } from "@/domain";
import { useFormErrorHandler } from "@/hooks/use-api-error";
import { useSaveCategory } from "../../hooks";
import { slugify } from "../../product-form-model";

interface CategoryFormDialogProps {
  open: boolean;
  category: Category | null;
  nextSortOrder: number;
  onClose: () => void;
}

export function CategoryFormDialog({ open, category, nextSortOrder, onClose }: CategoryFormDialogProps) {
  const t = useTranslations("admin.categories");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const save = useSaveCategory();
  const handleError = useFormErrorHandler();
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        slug: z.string().trim().min(1, tValidation("required")).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, tValidation("slug")),
        nameEn: z.string().trim().min(1, tValidation("required")),
        nameFa: z.string().trim(),
        descriptionEn: z.string().trim(),
        descriptionFa: z.string().trim(),
        imageUrl: z.string().trim(),
        sortOrder: z.number(tValidation("integer")).int(tValidation("integer")),
      }),
    [tValidation],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: category?.slug ?? "",
      nameEn: category?.name.en ?? "",
      nameFa: category?.name.fa ?? "",
      descriptionEn: category?.description?.en ?? "",
      descriptionFa: category?.description?.fa ?? "",
      imageUrl: category?.imageUrl ?? "",
      sortOrder: category?.sortOrder ?? nextSortOrder,
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    const input: CategoryInput = {
      slug: values.slug,
      name: { en: values.nameEn, ...(values.nameFa ? { fa: values.nameFa } : {}) },
      description: values.descriptionEn ? { en: values.descriptionEn, ...(values.descriptionFa ? { fa: values.descriptionFa } : {}) } : null,
      imageUrl: values.imageUrl || null,
      sortOrder: values.sortOrder,
    };
    save.mutate(
      { id: category?.id, input },
      {
        onSuccess: () => {
          toast.success(t("saved"));
          onClose();
        },
        onError: (error) => setFormError(handleError(error, form.setError, { name: "nameEn" })),
      },
    );
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={category ? t("editTitle") : t("createTitle")}
      closeLabel={tCommon("close")}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button type="submit" form="category-form" loading={save.isPending}>
            {tCommon("save")}
          </Button>
        </>
      }
    >
      <form id="category-form" noValidate onSubmit={onSubmit} className="space-y-4">
        {formError ? <Alert tone="error">{formError}</Alert> : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField id="category-name-en" labelStyle="normal" label={`${t("name")} (${tCommon("english")})`} error={errors.nameEn?.message} required>
            <Input
              appearance="boxed"
              dir="ltr"
              {...form.register("nameEn", {
                onBlur: (event) => {
                  if (!form.getValues("slug")) form.setValue("slug", slugify(event.target.value));
                },
              })}
            />
          </FormField>
          <FormField id="category-name-fa" labelStyle="normal" label={`${t("name")} (${tCommon("persian")})`}>
            <Input appearance="boxed" dir="rtl" {...form.register("nameFa")} />
          </FormField>
        </div>
        <FormField id="category-slug" labelStyle="normal" label={t("slug")} error={errors.slug?.message} required>
          <Input appearance="boxed" dir="ltr" {...form.register("slug")} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField id="category-desc-en" labelStyle="normal" label={`${t("description")} (${tCommon("english")})`} optionalLabel={tCommon("optional")}>
            <Textarea appearance="boxed" dir="ltr" rows={3} {...form.register("descriptionEn")} />
          </FormField>
          <FormField id="category-desc-fa" labelStyle="normal" label={`${t("description")} (${tCommon("persian")})`} optionalLabel={tCommon("optional")}>
            <Textarea appearance="boxed" dir="rtl" rows={3} {...form.register("descriptionFa")} />
          </FormField>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
          <FormField id="category-image" labelStyle="normal" label={t("imageUrl")} optionalLabel={tCommon("optional")}>
            <Input appearance="boxed" dir="ltr" placeholder="/images/category-carousel/cat-01.png" {...form.register("imageUrl")} />
          </FormField>
          <FormField id="category-sort" labelStyle="normal" label={t("sortOrder")} error={errors.sortOrder?.message}>
            <Input appearance="boxed" type="number" dir="ltr" {...form.register("sortOrder", { valueAsNumber: true })} />
          </FormField>
        </div>
      </form>
    </Dialog>
  );
}
