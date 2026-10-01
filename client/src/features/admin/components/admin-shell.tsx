"use client";

import { ArrowLeft, ClipboardList, FolderTree, LayoutDashboard, LogOut, Menu, Package, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useId, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { LoadingBlock } from "@/components/ui/spinner";
import { siteConfig } from "@/config/site";
import { displayName } from "@/domain";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { useSession } from "@/features/auth/session";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

/** Admin layout: fixed sidebar on desktop, top bar + slide-over drawer on mobile. Admin role required. */
export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations("admin.nav");
  const tCommon = useTranslations("common");
  const tAdmin = useTranslations("admin");
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const links = [
    { href: "/admin", label: t("dashboard"), icon: LayoutDashboard, active: pathname === "/admin" },
    { href: "/admin/products", label: t("products"), icon: Package, active: pathname.startsWith("/admin/products") },
    { href: "/admin/categories", label: t("categories"), icon: FolderTree, active: pathname.startsWith("/admin/categories") },
    { href: "/admin/pre-orders", label: t("preOrders"), icon: ClipboardList, active: pathname.startsWith("/admin/pre-orders") },
  ];

  const nav = (
    <nav aria-label={t("label")} className="flex flex-1 flex-col gap-1 p-3">
      {links.map(({ href, label, icon: Icon, active }) => (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
            active ? "bg-sage text-neutral-900" : "text-neutral-600 hover:bg-sage-soft hover:text-neutral-900",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </Link>
      ))}
      <Link href="/" className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-600 hover:bg-sage-soft hover:text-neutral-900">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t("backToStore")}
      </Link>
    </nav>
  );

  return (
    <div className="flex min-h-dvh bg-neutral-50">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-neutral-200 bg-white lg:flex">
        <Brand />
        {nav}
        <UserFooter />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" aria-hidden onClick={() => setDrawerOpen(false)} /> : null}
      <aside
        id={drawerId}
        hidden={!drawerOpen}
        className="fixed inset-y-0 start-0 z-50 flex w-72 flex-col bg-white shadow-xl lg:hidden motion-safe:animate-fade-in"
      >
        <div className="flex items-center justify-between pe-3">
          <Brand />
          <button type="button" onClick={() => setDrawerOpen(false)} aria-label={tCommon("closeMenu")} className="rounded-md p-2 hover:bg-neutral-100">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {nav}
        <UserFooter />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-neutral-200 bg-white/90 px-4 backdrop-blur lg:px-8">
          <button
            type="button"
            className="rounded-md p-2 hover:bg-neutral-100 lg:hidden"
            aria-label={tCommon("openMenu")}
            aria-expanded={drawerOpen}
            aria-controls={drawerId}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <p className="text-sm text-neutral-500">{tAdmin("title")}</p>
          <LocaleSwitcher />
        </header>
        <main id="main-content" className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <RequireAuth requireAdmin>
            <Suspense fallback={<LoadingBlock label={tCommon("loading")} />}>{children}</Suspense>
          </RequireAuth>
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2 px-5 py-5">
      <Image src={siteConfig.logo} alt="" width={36} height={36} className="h-auto w-9" />
      <span className="text-base" dir="ltr">
        {siteConfig.name}
      </span>
    </Link>
  );
}

function UserFooter() {
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const { user, signOut } = useSession();
  const router = useRouter();
  if (!user) return null;
  return (
    <div className="border-t border-neutral-100 p-4">
      <p className="truncate text-sm text-neutral-900">{displayName(user)}</p>
      <p className="truncate text-xs text-neutral-500" dir="ltr">
        {user.email}
      </p>
      <button
        type="button"
        onClick={async () => {
          await signOut();
          toast.success(tAuth("signedOut"));
          router.push("/");
        }}
        className="mt-3 inline-flex items-center gap-2 text-sm text-red-700 hover:underline"
      >
        <LogOut className="size-4 rtl:rotate-180" aria-hidden /> {t("logout")}
      </button>
    </div>
  );
}
