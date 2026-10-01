"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { safeNextPath } from "../redirects";
import { useSession } from "../session";
import { AvatarUploader } from "./avatar-uploader";
import { ProfileForm } from "./profile-form";

/** Rendered inside the account layout's <RequireAuth>, so the user is always present. */
export function ProfileView({ next }: { next: string | null }) {
  const t = useTranslations("profile");
  const { user } = useSession();
  const router = useRouter();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-md sm:p-8">
      <h1 className="text-2xl text-ink">{t("editTitle")}</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-500">{t("editSubtitle")}</p>
      <div className="mb-8 border-b border-neutral-100 pb-8">
        <AvatarUploader user={user} />
      </div>
      <ProfileForm
        user={user}
        mode={user.isProfileComplete ? "edit" : "complete"}
        onSaved={() => {
          const target = safeNextPath(next);
          if (target) router.push(target);
        }}
      />
    </div>
  );
}
