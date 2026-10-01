"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select } from "@/components/ui/form-controls";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/states";
import { availabilityStatuses, materialTypes, productStatuses, type Product } from "@/domain";
import { useFormErrorHandler } from "@/hooks/use-api-error";
import { useLocalize } from "@/hooks/use-localize";
import { useRouter } from "@/i18n/navigation";
import { useAdminCategories, useSaveProduct } from "../../hooks";
import { createProductFormSchema, emptyProductFormValues, formValuesToInput, productToFormValues, slugify, type ProductFormValues } from "../../product-form-model";
import { LocalizedField, NumberField } from "./form-fields";
import { ImageManager } from "./image-manager";
import { OptionsEditor } from "./options-editor";
import { SpecificationsEditor } from "./specifications-editor";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-neutral-200 bg-white p-5">
      <legend className="float-start mb-4 w-full text-base text-neutral-900">{title}</legend>
      <div className="clear-both space-y-4">{children}</div>
    </fieldset>
  );
}

/** Create/edit product form. Converts to `ProductInput` (docs/API.md §6.3) on submit. */
export function ProductForm({ product }: { product?: Product }) {
  const t = useTranslations("admin.productForm");
  const tProducts = useTranslations("admin.products");
  const tValidation = useTranslations("validation");
  const tMaterial = useTranslations("materialType");
  const tAvailability = useTranslations("availability");
  const tStatus = useTranslations("productStatus");
  const tCommon = useTranslations("common");
  const text = useLocalize();
  const router = useRouter();
  const categories = useAdminCategories();
  const save = useSaveProduct(product?.id);
  const handleError = useFormErrorHandler();
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(() => createProductFormSchema(tValidation), [tValidation]);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: product ? productToFormValues(product) : emptyProductFormValues(),
  });
  const { register, formState, setValue, getValues, control } = form;
  const { errors } = formState;
  const [pricingType, preOrderEnabled] = useWatch({ control, name: ["pricingType", "preOrderEnabled"] });

  const onSubmit = form.handleSubmit(
    (values) => {
      setFormError(null);
      save.mutate(formValuesToInput(values), {
        onSuccess: (saved) => {
          toast.success(tProducts("saved"));
          router.push(`/admin/products/${saved.id}`);
        },
        onError: (error) => setFormError(handleError(error, form.setError)),
      });
    },
    () => setFormError(t("unsaved")),
  );

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={onSubmit} className="space-y-6">
        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <Section title={t("basics")}>
          <LocalizedField name="title" label={t("title")} required />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-start gap-2">
              {/* FormField must wrap the input itself so id/aria wiring lands on it. */}
              <FormField id="product-slug" labelStyle="normal" label={t("slug")} hint={t("slugHint")} error={errors.slug?.message} required className="flex-1">
                <Input appearance="boxed" dir="ltr" {...register("slug")} />
              </FormField>
              <Button
                variant="outline"
                size="icon"
                className="mt-7 shrink-0"
                aria-label={t("generateSlug")}
                title={t("generateSlug")}
                onClick={() => setValue("slug", slugify(getValues("title.en")), { shouldValidate: true, shouldDirty: true })}
              >
                <Wand2 className="size-4" aria-hidden />
              </Button>
            </div>
            <FormField id="product-sku" labelStyle="normal" label={t("sku")} error={errors.sku?.message} required>
              <Input appearance="boxed" dir="ltr" {...register("sku")} />
            </FormField>
            <FormField id="product-category" labelStyle="normal" label={t("category")} error={errors.categoryId?.message} required>
              <Select {...register("categoryId")}>
                <option value="">{t("chooseCategory")}</option>
                {categories.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {text(category.name)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="product-material-type" labelStyle="normal" label={t("materialType")} required>
              <Select {...register("materialType")}>
                {materialTypes.map((type) => (
                  <option key={type} value={type}>
                    {tMaterial(type)}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <LocalizedField name="material" label={t("material")} required />
          <LocalizedField name="finish" label={t("finish")} />
          <LocalizedField name="origin" label={t("origin")} />
          <FormField id="product-tags" labelStyle="normal" label={t("tags")} hint={t("tagsHint")}>
            <Input appearance="boxed" {...register("tags")} />
          </FormField>
        </Section>

        <Section title={t("content")}>
          <LocalizedField name="shortDescription" label={t("shortDescription")} required />
          <LocalizedField name="description" label={t("description")} required multiline />
        </Section>

        <Section title={t("media")}>
          <ImageManager />
        </Section>

        <Section title={t("pricing")}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField id="product-pricing-type" labelStyle="normal" label={t("pricingType")}>
              <Select {...register("pricingType")}>
                <option value="fixed">{t("pricingFixed")}</option>
                <option value="range">{t("pricingRange")}</option>
                <option value="on_request">{t("pricingOnRequest")}</option>
              </Select>
            </FormField>
            {pricingType === "fixed" ? <NumberField name="amount" label={t("amount")} required step={100000} /> : null}
            {pricingType === "range" ? (
              <>
                <NumberField name="min" label={t("min")} required step={100000} />
                <NumberField name="max" label={t("max")} required step={100000} />
              </>
            ) : null}
          </div>
        </Section>

        <Section title={t("options")}>
          <OptionsEditor />
        </Section>

        <Section title={t("specifications")}>
          <SpecificationsEditor />
        </Section>

        <Section title={t("dimensions")}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <NumberField name="dimensions.length" label={t("lengthCm")} />
            <NumberField name="dimensions.width" label={t("widthCm")} />
            <NumberField name="dimensions.height" label={t("heightCm")} />
            <NumberField name="dimensions.weight" label={t("weightKg")} />
          </div>
        </Section>

        <Section title={t("preOrder")}>
          <Checkbox id="product-preorder-enabled" label={t("preOrderEnabled")} {...register("preOrderEnabled")} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3" hidden={!preOrderEnabled}>
            <NumberField name="minQuantity" label={t("minQuantity")} nullable={false} required />
            <NumberField name="maxQuantity" label={t("maxQuantity")} nullable={false} required />
            <NumberField name="leadTimeDays" label={t("leadTimeDays")} />
          </div>
        </Section>

        <Section title={t("publishing")}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField id="product-availability" labelStyle="normal" label={t("availability")}>
              <Select {...register("availability")}>
                {availabilityStatuses.map((status) => (
                  <option key={status} value={status}>
                    {tAvailability(status)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="product-status" labelStyle="normal" label={t("status")}>
              <Select {...register("status")}>
                {productStatuses.map((status) => (
                  <option key={status} value={status}>
                    {tStatus(status)}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <Checkbox id="product-featured" label={t("featured")} {...register("isFeatured")} />
        </Section>

        <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
          <Button variant="outline" onClick={() => router.back()}>
            {tCommon("cancel")}
          </Button>
          <Button type="submit" loading={save.isPending}>
            {product ? t("update") : t("create")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
