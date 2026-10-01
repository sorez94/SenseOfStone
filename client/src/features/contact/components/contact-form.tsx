"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form-controls";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/states";
import { useFormErrorHandler } from "@/hooks/use-api-error";
import { useServices } from "@/providers/services-context";
import { createContactSchema, type ContactValues } from "../schema";

/** Public "Contact us" form. Sends `POST /contact`; no sign-in needed. */
export function ContactForm() {
  const t = useTranslations("contact");
  const tValidation = useTranslations("validation");
  const services = useServices();
  const handleError = useFormErrorHandler();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const form = useForm<ContactValues>({
    resolver: zodResolver(createContactSchema(tValidation)),
    defaultValues: { name: "", email: "", message: "" },
  });
  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: (values: ContactValues) => services.contact.send(values),
    onSuccess: () => {
      toast.success(t("sent"));
      setSent(true);
      form.reset();
    },
    onError: (error) => setFormError(handleError(error, form.setError)),
  });

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => {
        setFormError(null);
        setSent(false);
        mutation.mutate(values);
      })}
      className="space-y-8"
    >
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      {sent ? <Alert tone="success">{t("sent")}</Alert> : null}
      <FormField id="contact-name" label={t("name")} error={errors.name?.message} required>
        <Input autoComplete="name" {...form.register("name")} />
      </FormField>
      <FormField id="contact-email" label={t("email")} error={errors.email?.message} required>
        <Input type="email" dir="ltr" autoComplete="email" {...form.register("email")} />
      </FormField>
      <FormField id="contact-message" label={t("message")} error={errors.message?.message} required>
        <Textarea rows={5} placeholder={t("messagePlaceholder")} {...form.register("message")} />
      </FormField>
      <Button type="submit" size="lg" className="w-full sm:w-auto" loading={mutation.isPending}>
        {mutation.isPending ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
