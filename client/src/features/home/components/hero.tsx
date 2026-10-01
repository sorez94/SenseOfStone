import Image from "next/image";
import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/** A short, wide banner: the image is cropped (object-cover) to a fixed height instead of keeping its natural ratio, with text overlaid at all breakpoints. */
export function Hero() {
  const t = useTranslations("home");
  return (
    <section className="relative isolate h-[220px] overflow-hidden bg-sage sm:h-[260px] md:h-[320px] lg:h-[380px]">
      <Image
        src="/images/landing-products/p1.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-60 mix-blend-multiply"
      />
      <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col items-start justify-center gap-3 px-6 py-6 lg:px-20">
        <p className="rounded-full bg-white/70 px-3 py-1 text-xs tracking-widest text-neutral-800 uppercase backdrop-blur rtl:tracking-normal">
          {t("heroEyebrow")}
        </p>
        <h1 className="max-w-2xl text-3xl leading-tight text-neutral-900 sm:text-4xl lg:text-6xl">{t("heroTitle")}</h1>
        <p className="max-w-xl text-sm text-neutral-800 lg:text-lg">{t("heroSubtitle")}</p>
        <Link href="/products" className={buttonStyles({ variant: "dark", size: "lg" })}>
          {t("heroCta")}
        </Link>
      </div>
    </section>
  );
}
