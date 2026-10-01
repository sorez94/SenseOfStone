"use client";

import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";
import { LoadingBlock } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/states";
import { buttonStyles } from "@/components/ui/button";
import { isAdmin, type User } from "@/domain";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { withNext } from "../redirects";
import { useSession } from "../session";

interface RequireAuthProps {
  children: ReactNode | ((user: User) => ReactNode);
  /** Redirect to /complete-profile when the profile is incomplete. */
  requireCompleteProfile?: boolean;
  requireAdmin?: boolean;
}

/**
 * Client-side route guard. `src/proxy.ts` already redirects requests without a token;
 * this guard validates the session with the API and enforces profile/role rules.
 * Authorization is always re-checked by the backend.
 */
export function RequireAuth({ children, requireCompleteProfile = false, requireAdmin = false }: RequireAuthProps) {
  const { status, user } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");

  const needsLogin = status === "unauthenticated";
  const needsProfile = status === "authenticated" && requireCompleteProfile && !user?.isProfileComplete;

  useEffect(() => {
    const next = `${pathname}${window.location.search}`;
    if (needsLogin) router.replace(withNext("/login", next));
    else if (needsProfile) router.replace(withNext("/complete-profile", next));
  }, [needsLogin, needsProfile, pathname, router]);

  if (status === "loading" || needsLogin || needsProfile || !user) {
    return <LoadingBlock label={t("loading")} />;
  }

  if (requireAdmin && !isAdmin(user)) {
    return (
      <EmptyState
        icon={<ShieldAlert className="size-14" strokeWidth={1.25} />}
        title={t("forbiddenTitle")}
        description={t("forbiddenDescription")}
        action={
          <Link href="/" className={buttonStyles()}>
            {t("goHome")}
          </Link>
        }
      />
    );
  }

  return <>{typeof children === "function" ? children(user) : children}</>;
}
