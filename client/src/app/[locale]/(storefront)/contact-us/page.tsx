import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container, RuledHeading } from "@/components/ui/section-title";
import { siteConfig } from "@/config/site";
import { ContactForm } from "@/features/contact/components/contact-form";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact-us">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "contact" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact-us">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const [t, tFooter] = await Promise.all([getTranslations("contact"), getTranslations("footer")]);

  return (
    <Container className="py-12 lg:py-20">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="order-2 flex flex-col gap-3 lg:order-1">
          <iframe
            src={siteConfig.contact.mapEmbedUrl}
            title={t("mapTitle")}
            className="h-[360px] w-full rounded-lg border border-neutral-200 lg:h-[500px]"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <address className="text-sm text-stone not-italic">{tFooter("address")}</address>
        </div>

        <div className="order-1 lg:order-2">
          <RuledHeading>{t("title")}</RuledHeading>
          <p className="mb-8 text-sm text-neutral-600">{t("subtitle")}</p>
          <ContactForm />
        </div>
      </div>
    </Container>
  );
}
