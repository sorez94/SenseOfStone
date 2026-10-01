import { z } from "zod";
import type { Product } from "@/domain";

type ValidationT = (key: "integer" | "min" | "max" | "optionRequired" | "maxLength", values?: Record<string, number>) => string;

/** Pre-order form schema derived from the product's own rules (quantity limits, required options). */
export function createPreOrderFormSchema(product: Pick<Product, "options" | "preOrder">, t: ValidationT) {
  const { minQuantity, maxQuantity } = product.preOrder;
  const options = Object.fromEntries(
    product.options.map((option) => [
      option.id,
      option.required
        ? z.string().refine((value) => option.values.some((v) => v.id === value), t("optionRequired"))
        : z.string().optional(),
    ]),
  );
  return z.object({
    quantity: z
      .number({ error: t("integer") })
      .int(t("integer"))
      .min(minQuantity, t("min", { min: minQuantity }))
      .max(maxQuantity, t("max", { max: maxQuantity })),
    options: z.object(options),
    note: z.string().trim().max(1000, t("maxLength", { max: 1000 })),
  });
}

export type PreOrderFormValues = z.infer<ReturnType<typeof createPreOrderFormSchema>>;
