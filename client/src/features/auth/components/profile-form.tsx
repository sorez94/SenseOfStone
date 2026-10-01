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
import type { User } from "@/domain";
import { useFormErrorHandler } from "@/hooks/use-api-error";
import { useServices } from "@/providers/services-context";
import { createProfileSchema, type ProfileFormInput, type ProfileValues } from "../schemas";
import { useSession } from "../session";

interface ProfileFormProps {
  user: User;
  /** "complete" sets all fields (PUT); "edit" patches (PATCH). */
  mode: "complete" | "edit";
  onSaved?: (user: User) => void;
}

/** Contact details form used for profile completion and for editing the profile. */
export function ProfileForm({ user, mode, onSaved }: ProfileFormProps) {
  const t = useTranslations("profile");
  const tValidation = useTranslations("validation");
  const tCommon = useTranslations("common");
  const services = useServices();
  const { setUser } = useSession();
  const handleError = useFormErrorHandler();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ProfileFormInput, unknown, ProfileValues>({
    resolver: zodResolver(createProfileSchema(tValidation)),
    defaultValues: {
      firstName: user.profile?.firstName ?? "",
      lastName: user.profile?.lastName ?? "",
      phone: user.profile?.phone ?? "",
      address: {
        city: user.profile?.address?.city ?? "",
        line: user.profile?.address?.line ?? "",
        postalCode: user.profile?.address?.postalCode ?? "",
      },
    },
  });
  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: (values: ProfileValues) => {
      const payload = { ...values, address: { ...values.address, postalCode: values.address.postalCode || undefined } };
      return mode === "complete" ? services.profile.complete(payload) : services.profile.update(payload);
    },
    onSuccess: (updated) => {
      setUser(updated);
      toast.success(t("saved"));
      onSaved?.(updated);
    },
    onError: (error) => setFormError(handleError(error, form.setError)),
  });

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => {
        setFormError(null);
        mutation.mutate(values);
      })}
      className="space-y-7"
    >
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      <FormField id="profile-email" label={t("email")}>
        <Input value={user.email} readOnly disabled dir="ltr" />
      </FormField>
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
        <FormField id="profile-first" label={t("firstName")} error={errors.firstName?.message} required>
          <Input autoComplete="given-name" {...form.register("firstName")} />
        </FormField>
        <FormField id="profile-last" label={t("lastName")} error={errors.lastName?.message} required>
          <Input autoComplete="family-name" {...form.register("lastName")} />
        </FormField>
      </div>
      <FormField id="profile-phone" label={t("phone")} hint={t("phoneHint")} error={errors.phone?.message} required>
        <Input type="tel" inputMode="tel" dir="ltr" autoComplete="tel" {...form.register("phone")} />
      </FormField>
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
        <FormField id="profile-city" label={t("city")} error={errors.address?.city?.message} required>
          <Input autoComplete="address-level2" {...form.register("address.city")} />
        </FormField>
        <FormField id="profile-postal" label={t("postalCode")} error={errors.address?.postalCode?.message} optionalLabel={tCommon("optional")}>
          <Input inputMode="numeric" dir="ltr" autoComplete="postal-code" {...form.register("address.postalCode")} />
        </FormField>
      </div>
      <FormField id="profile-line" label={t("addressLine")} error={errors.address?.line?.message} required>
        <Textarea rows={3} autoComplete="street-address" {...form.register("address.line")} />
      </FormField>
      <Button type="submit" size="lg" className="w-full sm:w-auto" loading={mutation.isPending}>
        {mode === "complete" ? t("save") : t("update")}
      </Button>
    </form>
  );
}
