"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/states";
import { useFormErrorHandler } from "@/hooks/use-api-error";
import { Link } from "@/i18n/navigation";
import { useServices } from "@/providers/services-context";
import { withNext } from "../redirects";
import { createRegisterSchema, type RegisterValues } from "../schemas";
import { useSession } from "../session";
import { AuthShell, OrDivider } from "./auth-shell";
import { GoogleSignIn } from "./google/google-sign-in";

export function RegisterForm({ next }: { next: string | null }) {
  const t = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const services = useServices();
  const { signIn } = useSession();
  const handleError = useFormErrorHandler();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(createRegisterSchema(tValidation)),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: ({ email, password }: RegisterValues) => services.auth.register({ email, password }),
    // New accounts have no profile: AuthShell forwards them to /complete-profile.
    onSuccess: (session) => {
      signIn(session);
      toast.success(t("signedIn"));
    },
    onError: (error) => setFormError(handleError(error, form.setError)),
  });

  return (
    <AuthShell title={t("registerTitle")} next={next}>
      <GoogleSignIn />
      <OrDivider label={t("or")} />
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => {
          setFormError(null);
          mutation.mutate(values);
        })}
        className="space-y-7"
      >
        {formError ? <Alert tone="error">{formError}</Alert> : null}
        <FormField id="register-email" label={t("email")} error={errors.email?.message} required>
          <Input type="email" dir="ltr" autoComplete="email" {...form.register("email")} />
        </FormField>
        <FormField id="register-password" label={t("password")} error={errors.password?.message} required>
          <Input type="password" dir="ltr" autoComplete="new-password" {...form.register("password")} />
        </FormField>
        <FormField id="register-confirm" label={t("confirmPassword")} error={errors.confirmPassword?.message} required>
          <Input type="password" dir="ltr" autoComplete="new-password" {...form.register("confirmPassword")} />
        </FormField>
        <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
          {t("submitRegister")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-600">
        {t("haveAccount")}{" "}
        <Link href={withNext("/login", next)} className="text-leaf-dark underline-offset-4 hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </AuthShell>
  );
}
