import { z } from "zod";

/** Rules mirror docs/API.md §4.8. Receives the "validation" translator so messages are localized. */
type ValidationT = (key: "required" | "email" | "minLength" | "maxLength", values?: Record<string, number>) => string;

export function createContactSchema(t: ValidationT) {
  return z.object({
    name: z.string().trim().min(2, t("minLength", { min: 2 })).max(80, t("maxLength", { max: 80 })),
    email: z.string().trim().min(1, t("required")).pipe(z.email(t("email"))),
    message: z.string().trim().min(10, t("minLength", { min: 10 })).max(2000, t("maxLength", { max: 2000 })),
  });
}
export type ContactValues = z.infer<ReturnType<typeof createContactSchema>>;
