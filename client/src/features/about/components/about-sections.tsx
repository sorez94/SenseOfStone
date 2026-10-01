import Image from "next/image";
import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/section-title";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

export function AboutBanner() {
  const t = useTranslations("about");
  return (
    <section className="relative isolate overflow-hidden bg-sage">
      <Image
        src="/images/about-us/about-us-company.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover opacity-40 mix-blend-multiply"
      />
      <div className="mx-auto flex min-h-[320px] max-w-7xl flex-col items-center justify-center gap-4 px-6 py-16 text-center lg:min-h-[460px]">
        <h1 className="font-display text-4xl tracking-wide text-neutral-900 uppercase sm:text-5xl lg:text-7xl rtl:tracking-normal">
          {t("title")}
        </h1>
        <p className="max-w-xl text-base text-neutral-800 lg:text-lg">{t("bannerSubtitle")}</p>
      </div>
    </section>
  );
}

/** Heading with a short rule under it, as in the SOS "ABOUT US" / "MISSION" / "VISION" blocks. */
function RuledTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 id={id} className="text-3xl leading-tight text-ink uppercase md:text-5xl">
        {children}
      </h2>
      <div aria-hidden className="mt-4 h-[3px] w-24 bg-ink" />
    </div>
  );
}

export function CompanyProfile() {
  const t = useTranslations("about");
  return (
    <section aria-labelledby="about-story" className="mx-auto max-w-5xl px-4 py-16 lg:py-24">
      <SectionTitle>{t("profileTitle")}</SectionTitle>
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="relative aspect-[4/3] w-full md:aspect-auto md:w-1/2">
          <Image src="/images/about-us/about-us-company.jpg" alt={t("companyImageAlt")} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="text-sm leading-7 text-neutral-700 md:w-1/2 md:ps-6">
          <RuledTitle id="about-story">{t("storyTitle")}</RuledTitle>
          <div className="space-y-4">
            <p>{t("story1")}</p>
            <p>{t("story2")}</p>
            <p>{t("story3")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Half text, half image row. `reverse` puts the image first (at the start side) on desktop. */
function ValueRow({ id, title, body, image, imageAlt, reverse = false }: { id: string; title: string; body: string; image: string; imageAlt: string; reverse?: boolean }) {
  return (
    <section aria-labelledby={id} className={cn("flex w-full flex-col md:flex-row", reverse && "md:flex-row-reverse")}>
      <div className="mx-auto flex w-full max-w-[500px] flex-col px-4 py-16 md:w-1/2 md:px-12 lg:py-36">
        <RuledTitle id={id}>{title}</RuledTitle>
        <p className="text-sm leading-7 text-neutral-700">{body}</p>
      </div>
      <div className="relative aspect-[4/3] w-full md:aspect-auto md:w-1/2">
        <Image src={image} alt={imageAlt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
      </div>
    </section>
  );
}

export function MissionVision() {
  const t = useTranslations("about");
  return (
    <>
      <ValueRow id="about-mission" title={t("missionTitle")} body={t("missionBody")} image="/images/about-us/mission.jpg" imageAlt={t("missionImageAlt")} />
      <ValueRow id="about-vision" title={t("visionTitle")} body={t("visionBody")} image="/images/about-us/vision.jpg" imageAlt={t("visionImageAlt")} reverse />
    </>
  );
}

export function AboutCta() {
  const t = useTranslations("about");
  return (
    <section aria-labelledby="about-cta" className="bg-sage-soft/60 px-6 py-16 text-center lg:py-20">
      <h2 id="about-cta" className="mb-6 text-2xl text-ink lg:text-3xl">
        {t("ctaTitle")}
      </h2>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/products" className={buttonStyles({ size: "lg" })}>
          {t("ctaProducts")}
        </Link>
        <Link href="/contact-us" className={buttonStyles({ variant: "outline", size: "lg" })}>
          {t("ctaContact")}
        </Link>
      </div>
    </section>
  );
}
