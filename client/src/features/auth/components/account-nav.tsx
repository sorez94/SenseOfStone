"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

export function AccountNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const links = [
    { href: "/account", label: t("profile"), active: pathname === "/account" },
    { href: "/account/pre-orders", label: t("myPreOrders"), active: pathname.startsWith("/account/pre-orders") },
  ];
  return (
    <nav aria-label={t("account")} className="mb-8 flex justify-center gap-2 border-b border-neutral-200">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={link.active ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 px-4 py-3 text-sm transition",
            link.active ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-900",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
