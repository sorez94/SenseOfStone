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
import { env } from "@/config/env";
import { useFormErrorHandler } from "@/hooks/use-api-error";
import { Link } from "@/i18n/navigation";
import { useServices } from "@/providers/services-context";
import { withNext } from "../redirects";
import { createLoginSchema, type LoginValues } from "../schemas";
import { useSession } from "../session";
import { AuthShell, OrDivider } from "./auth-shell";
import { GoogleSignIn } from "./google/google-sign-in";

export function LoginForm({ next }: { next: string | null }) {
  const t = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const services = useServices();
  const { signIn } = useSession();
  const handleError = useFormErrorHandler();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginValues>({ resolver: zodResolver(createLoginSchema(tValidation)), defaultValues: { email: "", password: "" } });
  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: services.auth.login,
    onSuccess: (session) => {
      signIn(session);
      toast.success(t("signedIn"));
    },
    onError: (error) => setFormError(handleError(error, form.setError)),
  });

  return (
    <AuthShell title={t("loginTitle")} next={next}>
      {next ? <Alert className="mb-6">{t("loginNextHint")}</Alert> : null}
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
        <FormField id="login-email" label={t("email")} error={errors.email?.message} required>
          <Input type="email" dir="ltr" autoComplete="email" {...form.register("email")} />
        </FormField>
        <FormField id="login-password" label={t("password")} error={errors.password?.message} required>
          <Input type="password" dir="ltr" autoComplete="current-password" {...form.register("password")} />
        </FormField>
        <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
          {mutation.isPending ? t("signingIn") : t("submitLogin")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-600">
        {t("noAccount")}{" "}
        <Link href={withNext("/register", next)} className="text-leaf-dark underline-offset-4 hover:underline">
          {t("registerLink")}
        </Link>
      </p>
      {env.apiMode === "mock" ? <DemoAccounts /> : null}
    </AuthShell>
  );
}

function DemoAccounts() {
  const t = useTranslations("auth");
  return (
    <div className="mt-6 rounded-md border border-dashed border-neutral-300 p-3 text-xs text-neutral-500" dir="ltr">
      <p className="mb-1 font-medium">{t("demoTitle")}</p>
      <p>{t("demoCustomer", { email: "customer@example.com", password: "customer1234" })}</p>
      <p>{t("demoAdmin", { email: "admin@senseofstone.com", password: "admin1234" })}</p>
    </div>
  );
}
