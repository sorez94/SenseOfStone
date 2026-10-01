"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { localeMeta, locales, type Locale } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

/** Switches language while keeping the current page and query string (like SOS's "EN ▾" selector). */
export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- pathname and params always belong to the current route.
        { pathname, params, query: Object.fromEntries(new URLSearchParams(window.location.search)) },
        { locale: next },
      );
    });
  }

  return (
    <label className={cn("relative inline-flex items-center", className)}>
      <span className="sr-only">{t("language")}</span>
      <Globe aria-hidden className="pointer-events-none absolute start-2 size-4 text-neutral-600" />
      <select
        value={locale}
        disabled={pending}
        onChange={(event) => change(event.target.value as Locale)}
        className="h-9 cursor-pointer appearance-none rounded-md border border-transparent bg-white/60 ps-7 pe-3 text-sm hover:border-neutral-300 focus:border-neutral-900 focus:outline-none"
      >
        {locales.map((value) => (
          <option key={value} value={value} lang={value}>
            {localeMeta[value].shortLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
