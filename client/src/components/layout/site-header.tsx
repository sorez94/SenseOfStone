"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { siteConfig } from "@/config/site";
import { AccountMenu } from "@/features/auth/components/account-menu";
import { useSession } from "@/features/auth/session";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { LocaleSwitcher } from "./locale-switcher";

/**
 * SOS header: frosted-glass bar, logo + wordmark at the start, centred links with an
 * underline on hover/active, account + language at the end, and a slide-down mobile menu.
 */
export function SiteHeader() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const { status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileMenuId = useId();

  const links = [
    { href: "/", label: t("home") },
    { href: "/products", label: t("products") },
    { href: "/about-us", label: t("about") },
    { href: "/contact-us", label: t("contact") },
    ...(status === "authenticated" ? [{ href: "/account/pre-orders", label: t("myPreOrders") }] : []),
  ];
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  // Close the mobile menu after navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="relative flex h-14 items-center justify-between border-b border-white/20 bg-gradient-to-r from-sage-soft/70 to-white/80 px-4 shadow-md backdrop-blur-xl transition-all sm:px-6 md:h-16 lg:h-[72px] lg:px-20">
        <Link href="/" className="flex shrink-0 items-center gap-2 transition-transform motion-safe:hover:scale-105">
          <Image src={siteConfig.logo} alt="" width={70} height={70} priority className="h-auto w-[28px] sm:w-[34px] lg:w-[42px]" />
          <span className="text-sm whitespace-nowrap select-none sm:text-base lg:text-lg" dir="ltr">
            {siteConfig.name}
          </span>
        </Link>

        <nav aria-label={t("main")} className="absolute start-1/2 hidden -translate-x-1/2 md:block rtl:translate-x-1/2">
          <ul className="flex gap-4 lg:gap-8">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "border-b-2 pb-0.5 text-sm whitespace-nowrap transition-all hover:border-neutral-900 lg:text-lg",
                    isActive(href) ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-600",
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <AccountMenu />
          <LocaleSwitcher />
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-md md:hidden"
            aria-label={menuOpen ? tCommon("closeMenu") : tCommon("openMenu")}
            aria-expanded={menuOpen}
            aria-controls={mobileMenuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
          </button>
        </div>
      </div>

      <nav
        id={mobileMenuId}
        aria-label={t("main")}
        hidden={!menuOpen}
        className="absolute inset-x-0 top-full border-t border-white/30 bg-white/90 shadow-xl backdrop-blur-md md:hidden motion-safe:animate-slide-down"
      >
        <ul className="flex flex-col gap-1 px-4 py-3">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn("block rounded-md px-2 py-2.5 text-base", isActive(href) ? "bg-sage-soft text-neutral-900" : "text-neutral-700")}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
