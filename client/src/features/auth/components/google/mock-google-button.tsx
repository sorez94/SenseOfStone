"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/form-controls";
import { FormField } from "@/components/ui/form-field";
import { encodeMockGoogleToken } from "@/mocks/google-token";
import { GoogleIcon } from "./google-icon";

const presetAccounts = [
  { email: "sara.ahmadi@gmail.com", given_name: "Sara", family_name: "Ahmadi" },
  { email: "customer@example.com", given_name: "Ali", family_name: "Rezaei" },
];

/**
 * Development stand-in for Google sign-in: a fake account chooser that produces a
 * mock ID token with the same claims Google would send. Used when no client ID is configured.
 */
export function MockGoogleButton({ label, onCredential, disabled }: { label: string; onCredential: (idToken: string) => void; disabled?: boolean }) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const [open, setOpen] = useState(false);

  const schema = z.object({
    email: z.string().trim().pipe(z.email(tValidation("email"))),
    firstName: z.string().trim(),
    lastName: z.string().trim(),
  });
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: "", firstName: "", lastName: "" } });

  const choose = (claims: Parameters<typeof encodeMockGoogleToken>[0]) => {
    setOpen(false);
    onCredential(encodeMockGoogleToken(claims));
  };

  return (
    <>
      <Button variant="outline" size="lg" className="w-full" onClick={() => setOpen(true)} disabled={disabled} icon={<GoogleIcon className="size-5" />}>
        {label}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t("googleChooserTitle")} description={t("googleChooserBody")} closeLabel={tCommon("close")}>
        <ul className="mb-6 space-y-2">
          {presetAccounts.map((account) => (
            <li key={account.email}>
              <button
                type="button"
                onClick={() => choose(account)}
                className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 text-start transition hover:border-neutral-900 hover:bg-neutral-50"
              >
                <span aria-hidden className="flex size-9 items-center justify-center rounded-full bg-sage text-sm text-neutral-900">
                  {account.given_name[0]}
                </span>
                <span className="flex flex-col">
                  <span className="text-sm text-neutral-900">
                    {account.given_name} {account.family_name}
                  </span>
                  <span className="text-xs text-neutral-500" dir="ltr">
                    {account.email}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <form
          noValidate
          onSubmit={form.handleSubmit((values) =>
            choose({ email: values.email, given_name: values.firstName || undefined, family_name: values.lastName || undefined }),
          )}
          className="space-y-4 border-t border-neutral-100 pt-5"
        >
          <FormField id="mock-google-email" label={t("googleCustomEmail")} error={form.formState.errors.email?.message} required>
            <Input type="email" dir="ltr" autoComplete="email" {...form.register("email")} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField id="mock-google-first" label={t("googleFirstName")} optionalLabel={tCommon("optional")}>
              <Input {...form.register("firstName")} />
            </FormField>
            <FormField id="mock-google-last" label={t("googleLastName")} optionalLabel={tCommon("optional")}>
              <Input {...form.register("lastName")} />
            </FormField>
          </div>
          <Button type="submit" className="w-full">
            {t("googleUseAccount")}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
