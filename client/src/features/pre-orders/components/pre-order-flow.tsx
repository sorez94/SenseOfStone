"use client";

import { CheckCircle2, LogIn, UserRoundPen } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { buttonStyles } from "@/components/ui/button";
import { LoadingBlock } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/states";
import { canBePreOrdered, sortImages, type PreOrder, type Product } from "@/domain";
import { withNext } from "@/features/auth/redirects";
import { useSession } from "@/features/auth/session";
import { useFormatters } from "@/hooks/use-formatters";
import { useLocalize } from "@/hooks/use-localize";
import { Link } from "@/i18n/navigation";
import { PreOrderForm } from "./pre-order-form";

/**
 * Pre-order flow (docs/ARCHITECTURE.md → "Pre-order flow"):
 * guest → ask to sign in/register · incomplete profile → ask to complete it ·
 * otherwise show the form → on success show the confirmation.
 */
export function PreOrderFlow({ product }: { product: Product }) {
  const t = useTranslations("preOrder");
  const tCommon = useTranslations("common");
  const { status, user } = useSession();
  const [created, setCreated] = useState<PreOrder | null>(null);
  const returnPath = `/products/${product.slug}/pre-order`;

  let body: React.ReactNode;
  if (created) {
    body = <PreOrderConfirmation preOrder={created} />;
  } else if (!canBePreOrdered(product)) {
    body = <Alert tone="error">{t("notAvailable")}</Alert>;
  } else if (status === "loading") {
    body = <LoadingBlock label={tCommon("loading")} className="min-h-48" />;
  } else if (!user) {
    body = (
      <GateCard icon={<LogIn className="size-8" aria-hidden />} title={t("signInTitle")} body={t("signInBody")}>
        <Link href={withNext("/login", returnPath)} className={buttonStyles()}>
          {t("signIn")}
        </Link>
        <Link href={withNext("/register", returnPath)} className={buttonStyles({ variant: "outline" })}>
          {t("createAccount")}
        </Link>
      </GateCard>
    );
  } else if (!user.isProfileComplete) {
    body = (
      <GateCard icon={<UserRoundPen className="size-8" aria-hidden />} title={t("completeProfileTitle")} body={t("completeProfileBody")}>
        <Link href={withNext("/complete-profile", returnPath)} className={buttonStyles()}>
          {t("completeProfile")}
        </Link>
      </GateCard>
    );
  } else {
    body = <PreOrderForm product={product} user={user} onCreated={setCreated} />;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12">
      <ProductSummaryCard product={product} />
      <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">{body}</div>
    </div>
  );
}

function GateCard({ icon, title, body, children }: { icon: React.ReactNode; title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-sage-soft text-sage-deep">{icon}</span>
      <h2 className="text-xl text-neutral-900">{title}</h2>
      <p className="max-w-sm text-sm text-neutral-600">{body}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-3">{children}</div>
    </div>
  );
}

function ProductSummaryCard({ product }: { product: Product }) {
  const text = useLocalize();
  const format = useFormatters();
  const cover = sortImages(product.images)[0];
  return (
    <aside className="h-fit overflow-hidden rounded-2xl bg-white shadow-md lg:sticky lg:top-32">
      {cover ? (
        <div className="relative aspect-[3/2]">
          <Image src={cover.url} alt={text(cover.alt)} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
        </div>
      ) : null}
      <div className="space-y-1 p-5">
        <p className="text-xs tracking-wide text-neutral-500 uppercase rtl:tracking-normal">{text(product.category.name)}</p>
        <h2 className="text-xl text-neutral-900">
          <Link href={`/products/${product.slug}`} className="hover:underline">
            {text(product.title)}
          </Link>
        </h2>
        <p className="text-sm text-neutral-500">{text(product.material)}</p>
        <p className="pt-1 text-leaf-dark">{format.pricing(product.pricing)}</p>
      </div>
    </aside>
  );
}

function PreOrderConfirmation({ preOrder }: { preOrder: PreOrder }) {
  const t = useTranslations("preOrder");
  return (
    <div role="status" className="flex flex-col items-center gap-4 py-8 text-center animate-fade-in">
      <CheckCircle2 className="size-16 text-leaf" aria-hidden strokeWidth={1.5} />
      <h2 className="text-2xl text-neutral-900">{t("successTitle")}</h2>
      <p className="max-w-md text-sm text-neutral-600">{t("successBody", { reference: preOrder.reference })}</p>
      <p className="rounded-md bg-sage-soft px-4 py-2 font-mono text-lg tracking-wider text-neutral-900" dir="ltr">
        {preOrder.reference}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link href={`/account/pre-orders/${preOrder.id}`} className={buttonStyles()}>
          {t("viewPreOrder")}
        </Link>
        <Link href="/products" className={buttonStyles({ variant: "outline" })}>
          {t("continueBrowsing")}
        </Link>
      </div>
    </div>
  );
}
