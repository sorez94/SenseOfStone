"use client";

import { useTranslations } from "next-intl";
import { RuledHeading } from "@/components/ui/section-title";
import { useRouter } from "@/i18n/navigation";
import { resolvePostAuthPath } from "../redirects";
import { ProfileForm } from "./profile-form";
import { RequireAuth } from "./require-auth";

/** Mandatory step after sign-up (or before pre-ordering) until the profile is complete. */
export function CompleteProfileView({ next }: { next: string | null }) {
  const t = useTranslations("profile");
  const router = useRouter();

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:py-16">
      <RequireAuth>
        {(user) => (
          <div className="rounded-lg bg-white p-6 shadow-lg sm:p-8">
            <RuledHeading>{t("completeTitle")}</RuledHeading>
            <p className="-mt-4 mb-8 text-sm text-neutral-600">{t("completeSubtitle")}</p>
            <ProfileForm user={user} mode="complete" onSaved={(updated) => router.replace(resolvePostAuthPath(updated, next))} />
          </div>
        )}
      </RequireAuth>
    </section>
  );
}
