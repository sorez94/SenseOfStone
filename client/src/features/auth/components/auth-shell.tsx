"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";
import { LoadingBlock } from "@/components/ui/spinner";
import { RuledHeading } from "@/components/ui/section-title";
import { useRouter } from "@/i18n/navigation";
import { resolvePostAuthPath } from "../redirects";
import { useSession } from "../session";

/**
 * SOS login layout: a welcome card with illustration next to the form card with a ruled heading.
 * Signed-in visitors are forwarded to their destination (or to profile completion).
 */
export function AuthShell({ title, next, children }: { title: string; next: string | null; children: ReactNode }) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { status, user } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user) router.replace(resolvePostAuthPath(user, next));
  }, [status, user, next, router]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10 lg:py-16">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="order-2 hidden flex-col rounded-lg border border-neutral-300 bg-white p-8 sm:flex lg:order-1">
          <h2 className="mb-3 text-2xl text-neutral-900">{t("welcomeTitle")}</h2>
          <p className="mb-8 text-sm text-neutral-600">{t("welcomeBody")}</p>
          <div className="mt-auto flex justify-center">
            <Image src="/images/login/login.png" alt="" width={260} height={260} className="h-auto w-[220px] lg:w-[260px]" />
          </div>
        </div>
        <div className="order-1 rounded-lg bg-white p-6 shadow-lg sm:p-8 lg:order-2">
          <RuledHeading>{title}</RuledHeading>
          {status === "authenticated" ? <LoadingBlock label={tCommon("loading")} className="min-h-40" /> : children}
        </div>
      </div>
    </section>
  );
}

export function OrDivider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-neutral-400 uppercase" role="separator">
      <span className="h-px flex-1 bg-neutral-200" />
      {label}
      <span className="h-px flex-1 bg-neutral-200" />
    </div>
  );
}
