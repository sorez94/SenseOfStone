import { ClipboardCheck, PhoneCall, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function HowItWorks() {
  const t = useTranslations("home");
  const steps = [
    { icon: Search, title: t("howStep1Title"), body: t("howStep1Body") },
    { icon: ClipboardCheck, title: t("howStep2Title"), body: t("howStep2Body") },
    { icon: PhoneCall, title: t("howStep3Title"), body: t("howStep3Body") },
  ];

  return (
    <section aria-labelledby="how-heading" className="bg-sage-soft/60 px-6 py-16 lg:py-24">
      <h2 id="how-heading" className="mb-10 text-center text-2xl text-ink lg:text-4xl">
        {t("howTitle")}
      </h2>
      <ol className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, body }, index) => (
          <li key={title} className="flex flex-col items-center gap-3 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-white shadow-md">
              <Icon className="size-6 text-sage-deep" aria-hidden />
            </span>
            <h3 className="text-lg text-neutral-900">
              <span className="text-sage-deep">{index + 1}.</span> {title}
            </h3>
            <p className="max-w-xs text-sm text-neutral-600">{body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 text-center">
        <Link href="/products" className={buttonStyles()}>
          {t("viewAll")}
        </Link>
      </div>
    </section>
  );
}
