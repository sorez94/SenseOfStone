"use client";

import { useMutation } from "@tanstack/react-query";
import { ImagePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { displayName, type User } from "@/domain";
import { useApiErrorMessage } from "@/hooks/use-api-error";
import { useServices } from "@/providers/services-context";
import { useSession } from "../session";

const ALLOWED_TYPES = "image/jpeg,image/png,image/webp,image/avif";

/** Lets the user set, replace or remove their (optional) profile picture. */
export function AvatarUploader({ user }: { user: User }) {
  const t = useTranslations("profile");
  const { profile } = useServices();
  const { setUser } = useSession();
  const errorMessage = useApiErrorMessage();
  const fileInput = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const upload = useMutation({
    mutationFn: (file: File) => profile.uploadAvatar(file),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success(t("photoUpdated"));
    },
    onError: (error) => toast.error(errorMessage(error)),
    onSettled: () => {
      if (fileInput.current) fileInput.current.value = "";
    },
  });

  const remove = useMutation({
    mutationFn: () => profile.removeAvatar(),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success(t("photoRemoved"));
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const pending = upload.isPending || remove.isPending;

  return (
    <div className="flex items-center gap-4">
      <Avatar src={user.avatarUrl} alt={displayName(user)} size={72} />
      <div className="flex flex-col gap-2">
        <input
          ref={fileInput}
          id={inputId}
          type="file"
          accept={ALLOWED_TYPES}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload.mutate(file);
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={upload.isPending}
            disabled={pending}
            icon={<ImagePlus className="size-4" aria-hidden />}
            onClick={() => fileInput.current?.click()}
          >
            {user.avatarUrl ? t("changePhoto") : t("uploadPhoto")}
          </Button>
          {user.avatarUrl ? (
            <Button variant="ghost" size="sm" loading={remove.isPending} disabled={pending} onClick={() => remove.mutate()}>
              {t("removePhoto")}
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-neutral-500">{t("photoHint")}</p>
      </div>
    </div>
  );
}
