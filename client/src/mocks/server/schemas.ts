import { z } from "zod";
import { availabilityStatuses, materialTypes, preOrderStatuses, productStatuses } from "@/domain";

/**
 * Request validation used by the fake backend. These mirror the rules in
 * docs/API.md and should be re-implemented by the real backend.
 */

const localized = z.object({ en: z.string().trim().min(1), fa: z.string().trim().optional() });
const optionalLocalized = z.object({ en: z.string().trim(), fa: z.string().trim().optional() }).nullable();
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Must be lowercase kebab-case");
const money = z.number().int().nonnegative();
const nullableMeasure = z.number().nonnegative().nullable();
const phone = z.string().regex(/^\+?[0-9]{10,14}$/, "Invalid phone number");

export const googleAuthSchema = z.object({ idToken: z.string().min(10) });
export const loginSchema = z.object({ email: z.email(), password: z.string().min(1) });
export const registerSchema = z.object({ email: z.email(), password: z.string().min(8).max(128) });

export const addressSchema = z.object({
  city: z.string().trim().min(2).max(80),
  line: z.string().trim().min(5).max(300),
  postalCode: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Postal code must be 10 digits")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  phone,
  address: addressSchema,
});
export const profilePatchSchema = profileSchema.partial().extend({ address: addressSchema.optional() });

export const pricingSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("fixed"), amount: money }),
  z.object({ type: z.literal("range"), min: money, max: money }).refine((p) => p.max >= p.min, { message: "max must be >= min", path: ["max"] }),
  z.object({ type: z.literal("on_request") }),
]);

export const optionsSchema = z.array(
  z.object({
    id: z.string().optional(),
    name: localized,
    required: z.boolean(),
    values: z
      .array(z.object({ id: z.string().optional(), label: localized, priceDelta: z.number().int() }))
      .min(1),
  }),
);

export const productInputSchema = z.object({
  slug,
  sku: z.string().trim().min(1).max(40),
  title: localized,
  shortDescription: localized,
  description: localized,
  categoryId: z.string().min(1),
  materialType: z.enum(materialTypes),
  material: localized,
  finish: optionalLocalized,
  origin: optionalLocalized,
  dimensions: z.object({ length: nullableMeasure, width: nullableMeasure, height: nullableMeasure, weight: nullableMeasure }),
  images: z.array(z.object({ id: z.string().optional(), url: z.string().min(1), alt: localized, sortOrder: z.number().int() })).max(20),
  pricing: pricingSchema,
  options: optionsSchema,
  specifications: z.array(z.object({ label: localized, value: localized })),
  availability: z.enum(availabilityStatuses),
  preOrder: z
    .object({
      enabled: z.boolean(),
      minQuantity: z.number().int().min(1),
      maxQuantity: z.number().int().min(1),
      leadTimeDays: z.number().int().nonnegative().nullable(),
    })
    .refine((p) => p.maxQuantity >= p.minQuantity, { message: "maxQuantity must be >= minQuantity", path: ["maxQuantity"] }),
  isFeatured: z.boolean(),
  status: z.enum(productStatuses),
  tags: z.array(z.string().trim().min(1)).max(20),
});

export const productStatusSchema = z.object({ status: z.enum(productStatuses) });

export const categoryInputSchema = z.object({
  slug,
  name: localized,
  description: optionalLocalized,
  imageUrl: z.string().min(1).nullable(),
  sortOrder: z.number().int(),
});

export const createPreOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
        options: z.record(z.string(), z.string()),
      }),
    )
    .min(1)
    .max(20),
  customerNote: z.string().trim().max(1000).optional(),
});

export const cancelPreOrderSchema = z.object({ reason: z.string().trim().max(500).optional() }).optional();
export const preOrderStatusSchema = z.object({ status: z.enum(preOrderStatuses), note: z.string().trim().max(1000).optional() });
export const preOrderNoteSchema = z.object({ adminNote: z.string().trim().max(2000).nullable() });

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email(),
  message: z.string().trim().min(10).max(2000),
});
