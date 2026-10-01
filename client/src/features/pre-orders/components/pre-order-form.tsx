"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-controls";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/states";
import { estimateTotal, unitPriceWithOptions, type PreOrder, type Product, type User } from "@/domain";
import { useFormErrorHandler } from "@/hooks/use-api-error";
import { useFormatters } from "@/hooks/use-formatters";
import { useLocalize } from "@/hooks/use-localize";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { useCreatePreOrder } from "../hooks";
import { createPreOrderFormSchema, type PreOrderFormValues } from "../schema";
import { QuantityInput } from "./quantity-input";

interface PreOrderFormProps {
  product: Product;
  user: User;
  onCreated: (preOrder: PreOrder) => void;
}

export function PreOrderForm({ product, user, onCreated }: PreOrderFormProps) {
  const t = useTranslations("preOrder");
  const tValidation = useTranslations("validation");
  const tCommon = useTranslations("common");
  const text = useLocalize();
  const format = useFormatters();
  const handleError = useFormErrorHandler();
  const createPreOrder = useCreatePreOrder();
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(() => createPreOrderFormSchema(product, tValidation), [product, tValidation]);
  const form = useForm<PreOrderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity: product.preOrder.minQuantity,
      // Pre-select the first value of required options to reduce effort.
      options: Object.fromEntries(product.options.map((o) => [o.id, o.required ? (o.values[0]?.id ?? "") : ""])),
      note: "",
    },
  });
  const { errors } = form.formState;
  const [quantity, selection] = useWatch({ control: form.control, name: ["quantity", "options"] });

  const estimate = useMemo(() => {
    const deltas = product.options.flatMap((option) => option.values.filter((v) => v.id === selection?.[option.id]));
    const unitPrice = unitPriceWithOptions(product.pricing, deltas);
    return estimateTotal([{ unitPrice, quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1 }]);
  }, [product, selection, quantity]);

  const onSubmit = (values: PreOrderFormValues) => {
    setFormError(null);
    const options = Object.fromEntries(Object.entries(values.options).filter((entry): entry is [string, string] => Boolean(entry[1])));
    createPreOrder.mutate(
      { items: [{ productId: product.id, quantity: values.quantity, options }], customerNote: values.note || undefined },
      {
        onSuccess: onCreated,
        onError: (error) =>
          setFormError(
            handleError(error, form.setError, {
              "items.0.quantity": "quantity",
              ...Object.fromEntries(product.options.map((o) => [`items.0.options.${o.id}`, `options.${o.id}` as const])),
            }),
          ),
      },
    );
  };

  const profile = user.profile;

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {formError ? <Alert tone="error">{formError}</Alert> : null}

      {product.options.length ? (
        <div className="space-y-6">
          <h2 className="text-lg text-neutral-900">{t("options")}</h2>
          {product.options.map((option) => {
            const error = errors.options?.[option.id]?.message;
            const errorId = `option-${option.id}-error`;
            return (
              <fieldset key={option.id} aria-describedby={error ? errorId : undefined}>
                <legend className="mb-2 text-xs font-semibold tracking-wide text-neutral-700 uppercase rtl:tracking-normal">
                  {text(option.name)}
                  {option.required ? <span aria-hidden className="ms-0.5 text-red-600">*</span> : null}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {option.values.map((value) => (
                    <label key={value.id} className="cursor-pointer">
                      <input type="radio" value={value.id} className="peer sr-only" {...form.register(`options.${option.id}`)} />
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm transition",
                          "border-neutral-300 text-neutral-700 hover:border-neutral-900",
                          "peer-checked:border-neutral-900 peer-checked:bg-neutral-900 peer-checked:text-white",
                          "peer-focus-visible:ring-2 peer-focus-visible:ring-leaf-dark peer-focus-visible:ring-offset-2",
                        )}
                      >
                        {text(value.label)}
                        {value.priceDelta ? (
                          <span className="text-xs opacity-75" dir="ltr">
                            {value.priceDelta > 0 ? "+" : "−"}
                            {format.number(Math.abs(value.priceDelta))}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
                {error ? (
                  <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
                    {error}
                  </p>
                ) : null}
              </fieldset>
            );
          })}
        </div>
      ) : null}

      <div>
        <label htmlFor="pre-order-quantity" className="mb-2 block text-xs font-semibold tracking-wide text-neutral-700 uppercase rtl:tracking-normal">
          {t("quantity")}
        </label>
        <Controller
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <QuantityInput
              id="pre-order-quantity"
              value={field.value}
              min={product.preOrder.minQuantity}
              max={product.preOrder.maxQuantity}
              onChange={field.onChange}
              invalid={Boolean(errors.quantity)}
              describedBy="pre-order-quantity-hint"
            />
          )}
        />
        <p id="pre-order-quantity-hint" className="mt-1 text-xs text-neutral-500">
          {t("quantityHint", { min: format.number(product.preOrder.minQuantity), max: format.number(product.preOrder.maxQuantity) })}
        </p>
        {errors.quantity ? (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {errors.quantity.message}
          </p>
        ) : null}
      </div>

      <FormField id="pre-order-note" label={t("note")} error={errors.note?.message} optionalLabel={tCommon("optional")}>
        <Textarea rows={3} placeholder={t("notePlaceholder")} {...form.register("note")} />
      </FormField>

      <div className="rounded-xl border border-neutral-200 p-4 text-sm">
        <div className="flex items-start justify-between gap-3">
          <p className="text-neutral-600">{t("contactDetails")}</p>
          <Link href={`/account?next=/products/${product.slug}/pre-order`} className="text-xs text-leaf-dark hover:underline">
            {t("editProfile")}
          </Link>
        </div>
        <p className="mt-1 text-neutral-900">
          {profile?.firstName} {profile?.lastName} · <span dir="ltr">{profile?.phone}</span>
        </p>
        <p className="text-neutral-600">
          {profile?.address?.city} — {profile?.address?.line}
        </p>
      </div>

      <div className="flex flex-col gap-4 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite">
          <p className="text-xs text-neutral-500">{t("estimate")}</p>
          <p className="text-xl text-leaf-dark">{format.estimate(estimate)}</p>
          <p className="text-xs text-neutral-500">{t("estimateDisclaimer")}</p>
        </div>
        <Button type="submit" size="lg" loading={createPreOrder.isPending}>
          {createPreOrder.isPending ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
