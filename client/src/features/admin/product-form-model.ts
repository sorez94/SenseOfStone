import { z } from "zod";
import {
  availabilityStatuses,
  materialTypes,
  pricingTypes,
  productStatuses,
  type LocalizedText,
  type Pricing,
  type Product,
  type ProductInput,
} from "@/domain";

type ValidationT = (key: "required" | "slug" | "min" | "integer" | "rangeOrder" | "atLeastOneValue" | "maxLength", values?: Record<string, number>) => string;

/**
 * Admin product form model. Kept separate from React so mapping/validation is unit-testable.
 * Numeric inputs use `setValueAs` → number | null.
 */
export function createProductFormSchema(t: ValidationT) {
  const requiredText = z.object({ en: z.string().trim().min(1, t("required")), fa: z.string().trim() });
  const optionalText = z.object({ en: z.string().trim(), fa: z.string().trim() });
  const money = z.number(t("integer")).int(t("integer")).min(0, t("min", { min: 0 }));
  const nullableMeasure = z.number(t("integer")).min(0, t("min", { min: 0 })).nullable();

  return z
    .object({
      slug: z.string().trim().min(1, t("required")).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t("slug")),
      sku: z.string().trim().min(1, t("required")).max(40, t("maxLength", { max: 40 })),
      title: requiredText,
      shortDescription: requiredText,
      description: requiredText,
      categoryId: z.string().min(1, t("required")),
      materialType: z.enum(materialTypes),
      material: requiredText,
      finish: optionalText,
      origin: optionalText,
      dimensions: z.object({ length: nullableMeasure, width: nullableMeasure, height: nullableMeasure, weight: nullableMeasure }),
      images: z.array(z.object({ id: z.string().optional(), url: z.string().min(1, t("required")), alt: optionalText })),
      pricingType: z.enum(pricingTypes),
      amount: money.nullable(),
      min: money.nullable(),
      max: money.nullable(),
      options: z.array(
        z.object({
          id: z.string().optional(),
          name: requiredText,
          required: z.boolean(),
          values: z
            .array(z.object({ id: z.string().optional(), label: requiredText, priceDelta: z.number(t("integer")).int(t("integer")) }))
            .min(1, t("atLeastOneValue")),
        }),
      ),
      specifications: z.array(z.object({ label: requiredText, value: requiredText })),
      availability: z.enum(availabilityStatuses),
      preOrderEnabled: z.boolean(),
      minQuantity: z.number(t("integer")).int(t("integer")).min(1, t("min", { min: 1 })),
      maxQuantity: z.number(t("integer")).int(t("integer")).min(1, t("min", { min: 1 })),
      leadTimeDays: z.number(t("integer")).int(t("integer")).min(0, t("min", { min: 0 })).nullable(),
      isFeatured: z.boolean(),
      status: z.enum(productStatuses),
      tags: z.string(),
    })
    .superRefine((values, ctx) => {
      if (values.pricingType === "fixed" && values.amount === null) ctx.addIssue({ code: "custom", path: ["amount"], message: t("required") });
      if (values.pricingType === "range") {
        if (values.min === null) ctx.addIssue({ code: "custom", path: ["min"], message: t("required") });
        if (values.max === null) ctx.addIssue({ code: "custom", path: ["max"], message: t("required") });
        if (values.min !== null && values.max !== null && values.max < values.min) ctx.addIssue({ code: "custom", path: ["max"], message: t("rangeOrder") });
      }
      if (values.maxQuantity < values.minQuantity) ctx.addIssue({ code: "custom", path: ["maxQuantity"], message: t("rangeOrder") });
    });
}

export type ProductFormValues = z.infer<ReturnType<typeof createProductFormSchema>>;

const emptyText = () => ({ en: "", fa: "" });
const toForm = (text: LocalizedText | null | undefined) => ({ en: text?.en ?? "", fa: text?.fa ?? "" });
const fromForm = (text: { en: string; fa: string }): LocalizedText => ({ en: text.en.trim(), ...(text.fa.trim() ? { fa: text.fa.trim() } : {}) });
const fromOptionalForm = (text: { en: string; fa: string }): LocalizedText | null => (text.en.trim() ? fromForm(text) : null);

export function emptyProductFormValues(): ProductFormValues {
  return {
    slug: "",
    sku: "",
    title: emptyText(),
    shortDescription: emptyText(),
    description: emptyText(),
    categoryId: "",
    materialType: "stone",
    material: emptyText(),
    finish: emptyText(),
    origin: emptyText(),
    dimensions: { length: null, width: null, height: null, weight: null },
    images: [],
    pricingType: "fixed",
    amount: null,
    min: null,
    max: null,
    options: [],
    specifications: [],
    availability: "made_to_order",
    preOrderEnabled: true,
    minQuantity: 1,
    maxQuantity: 10,
    leadTimeDays: 30,
    isFeatured: false,
    status: "draft",
    tags: "",
  };
}

export function productToFormValues(product: Product): ProductFormValues {
  const { pricing } = product;
  return {
    slug: product.slug,
    sku: product.sku,
    title: toForm(product.title),
    shortDescription: toForm(product.shortDescription),
    description: toForm(product.description),
    categoryId: product.category.id,
    materialType: product.materialType,
    material: toForm(product.material),
    finish: toForm(product.finish),
    origin: toForm(product.origin),
    dimensions: { ...product.dimensions },
    images: [...product.images].sort((a, b) => a.sortOrder - b.sortOrder).map((img) => ({ id: img.id, url: img.url, alt: toForm(img.alt) })),
    pricingType: pricing.type,
    amount: pricing.type === "fixed" ? pricing.amount : null,
    min: pricing.type === "range" ? pricing.min : null,
    max: pricing.type === "range" ? pricing.max : null,
    options: product.options.map((option) => ({
      id: option.id,
      name: toForm(option.name),
      required: option.required,
      values: option.values.map((value) => ({ id: value.id, label: toForm(value.label), priceDelta: value.priceDelta })),
    })),
    specifications: product.specifications.map((spec) => ({ label: toForm(spec.label), value: toForm(spec.value) })),
    availability: product.availability,
    preOrderEnabled: product.preOrder.enabled,
    minQuantity: product.preOrder.minQuantity,
    maxQuantity: product.preOrder.maxQuantity,
    leadTimeDays: product.preOrder.leadTimeDays,
    isFeatured: product.isFeatured,
    status: product.status,
    tags: product.tags.join(", "),
  };
}

function toPricing(values: ProductFormValues): Pricing {
  switch (values.pricingType) {
    case "fixed":
      return { type: "fixed", amount: values.amount ?? 0 };
    case "range":
      return { type: "range", min: values.min ?? 0, max: values.max ?? 0 };
    case "on_request":
      return { type: "on_request" };
  }
}

export function formValuesToInput(values: ProductFormValues): ProductInput {
  return {
    slug: values.slug.trim(),
    sku: values.sku.trim(),
    title: fromForm(values.title),
    shortDescription: fromForm(values.shortDescription),
    description: fromForm(values.description),
    categoryId: values.categoryId,
    materialType: values.materialType,
    material: fromForm(values.material),
    finish: fromOptionalForm(values.finish),
    origin: fromOptionalForm(values.origin),
    dimensions: values.dimensions,
    images: values.images.map((image, index) => ({ ...(image.id ? { id: image.id } : {}), url: image.url, alt: fromForm(image.alt.en ? image.alt : values.title), sortOrder: index })),
    pricing: toPricing(values),
    options: values.options.map((option) => ({
      ...(option.id ? { id: option.id } : {}),
      name: fromForm(option.name),
      required: option.required,
      values: option.values.map((value) => ({ ...(value.id ? { id: value.id } : {}), label: fromForm(value.label), priceDelta: value.priceDelta })),
    })),
    specifications: values.specifications.map((spec) => ({ label: fromForm(spec.label), value: fromForm(spec.value) })),
    availability: values.availability,
    preOrder: { enabled: values.preOrderEnabled, minQuantity: values.minQuantity, maxQuantity: values.maxQuantity, leadTimeDays: values.leadTimeDays },
    isFeatured: values.isFeatured,
    status: values.status,
    tags: values.tags
      .split(/[,،]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}

/** "Luna Coffee Table!" → "luna-coffee-table" */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
