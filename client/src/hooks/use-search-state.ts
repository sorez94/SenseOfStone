"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";

/**
 * Reads/writes string state in the URL query (shareable, survives reloads and back/forward).
 * Setting a key other than `page` resets pagination.
 */
export function useSearchState<K extends string>(keys: readonly K[]) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const values = useMemo(
    () => Object.fromEntries(keys.map((key) => [key, searchParams.get(key) ?? ""])) as Record<K, string>,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keys is a static tuple
    [searchParams],
  );

  const set = useCallback(
    (patch: Partial<Record<K | "page", string | number | undefined>>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "" || (key === "page" && value === 1)) next.delete(key);
        else next.set(key, String(value));
      }
      if (!("page" in patch)) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  return { values, page, set };
}
