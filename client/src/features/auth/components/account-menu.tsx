"use client";

import { ClipboardList, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { displayName, isAdmin } from "@/domain";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { useSession } from "../session";

const itemStyle = "flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm text-neutral-800 hover:bg-sage-soft focus:bg-sage-soft focus:outline-none";

/** User icon in the header: sign-in link for guests, disclosure menu for signed-in users. */
export function AccountMenu() {
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const { status, user, signOut } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status !== "authenticated" || !user) {
    return (
      <Link
        href="/login"
        aria-label={t("login")}
        aria-busy={status === "loading" || undefined}
        className="inline-flex size-9 items-center justify-center rounded-full transition hover:bg-white/70"
      >
        <UserRound className="size-5" aria-hidden />
      </Link>
    );
  }

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    toast.success(tAuth("signedOut"));
    router.push("/");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={t("accountMenu")}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-9 items-center justify-center rounded-full bg-sage-soft transition hover:bg-sage"
      >
        <Avatar src={user.avatarUrl} alt={displayName(user)} size={36} />
      </button>
      <div
        id={menuId}
        hidden={!open}
        className={cn("absolute end-0 top-11 z-50 w-60 rounded-xl border border-neutral-100 bg-white p-2 shadow-xl", open && "animate-slide-down")}
      >
        <div className="border-b border-neutral-100 px-3 pt-1 pb-2">
          <p className="truncate text-sm text-neutral-900">{displayName(user)}</p>
          <p className="truncate text-xs text-neutral-500" dir="ltr">
            {user.email}
          </p>
        </div>
        <ul className="mt-1 space-y-0.5">
          <li>
            <Link href="/account" className={itemStyle} onClick={() => setOpen(false)}>
              <UserRound className="size-4" aria-hidden /> {t("profile")}
            </Link>
          </li>
          <li>
            <Link href="/account/pre-orders" className={itemStyle} onClick={() => setOpen(false)}>
              <ClipboardList className="size-4" aria-hidden /> {t("myPreOrders")}
            </Link>
          </li>
          {isAdmin(user) ? (
            <li>
              <Link href="/admin" className={itemStyle} onClick={() => setOpen(false)}>
                <LayoutDashboard className="size-4" aria-hidden /> {t("adminDashboard")}
              </Link>
            </li>
          ) : null}
          <li>
            <button type="button" className={cn(itemStyle, "text-red-700")} onClick={handleLogout}>
              <LogOut className="size-4 rtl:rotate-180" aria-hidden /> {t("logout")}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
