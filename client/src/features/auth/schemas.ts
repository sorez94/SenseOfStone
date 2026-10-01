import { z } from "zod";

/**
 * Form schemas are factories receiving the "validation" translator so every
 * message is localized. Rules mirror docs/API.md §2.1 / §3.
 */
type ValidationT = (key: "required" | "email" | "minLength" | "maxLength" | "phone" | "postalCode" | "passwordMismatch", values?: Record<string, number>) => string;

/** Accepts Persian/Arabic digits and normalizes to ASCII before validating. */
export function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function createLoginSchema(t: ValidationT) {
  return z.object({
    email: z.string().trim().min(1, t("required")).pipe(z.email(t("email"))),
    password: z.string().min(1, t("required")),
  });
}
export type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;

export function createRegisterSchema(t: ValidationT) {
  return z
    .object({
      email: z.string().trim().min(1, t("required")).pipe(z.email(t("email"))),
      password: z.string().min(8, t("minLength", { min: 8 })).max(128, t("maxLength", { max: 128 })),
      confirmPassword: z.string().min(1, t("required")),
    })
    .refine((values) => values.password === values.confirmPassword, { message: t("passwordMismatch"), path: ["confirmPassword"] });
}
export type RegisterValues = z.infer<ReturnType<typeof createRegisterSchema>>;

export function createProfileSchema(t: ValidationT) {
  const name = z.string().trim().min(2, t("minLength", { min: 2 })).max(60, t("maxLength", { max: 60 }));
  return z.object({
    firstName: name,
    lastName: name,
    phone: z
      .string()
      .trim()
      .min(1, t("required"))
      .transform(normalizeDigits)
      .pipe(z.string().regex(/^\+?[0-9]{10,14}$/, t("phone"))),
    address: z.object({
      city: z.string().trim().min(2, t("minLength", { min: 2 })).max(80, t("maxLength", { max: 80 })),
      line: z.string().trim().min(5, t("minLength", { min: 5 })).max(300, t("maxLength", { max: 300 })),
      postalCode: z
        .string()
        .trim()
        .transform(normalizeDigits)
        .pipe(z.string().regex(/^([0-9]{10})?$/, t("postalCode")))
        .optional(),
    }),
  });
}
export type ProfileFormInput = z.input<ReturnType<typeof createProfileSchema>>;
export type ProfileValues = z.output<ReturnType<typeof createProfileSchema>>;
