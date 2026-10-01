import { AtSign, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";

/** SOS footer: sage background, three columns separated by vertical rules, copyright strip. */
export async function SiteFooter() {
  const t = await getTranslations("footer");
  const columnStyle = "flex flex-col items-center px-4 py-8 text-center md:px-10 lg:py-12";
  const headingStyle = "mb-4 text-base text-neutral-900 lg:mb-6 lg:text-xl";
  const textStyle = "text-sm text-stone lg:text-base";

  return (
    <footer className="mt-auto bg-sage">
      <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y-2 divide-sage-line md:grid-cols-3 md:divide-x-2 md:divide-y-0 rtl:md:divide-x-reverse">
        <section className={columnStyle} aria-labelledby="footer-address">
          <h2 id="footer-address" className={headingStyle}>
            {t("addressTitle")}
          </h2>
          <address className={`${textStyle} not-italic`}>{t("address")}</address>
        </section>
        <section className={columnStyle} aria-labelledby="footer-about">
          <h2 id="footer-about" className={headingStyle}>
            <Link href="/about-us" className="hover:text-leaf-dark">
              {t("aboutTitle")}
            </Link>
          </h2>
          <p className={textStyle}>{t("about")}</p>
        </section>
        <section className={columnStyle} aria-labelledby="footer-contact">
          <h2 id="footer-contact" className={headingStyle}>
            <Link href="/contact-us" className="hover:text-leaf-dark">
              {t("contactTitle")}
            </Link>
          </h2>
          <ul className="flex flex-col items-start gap-2">
            {siteConfig.contact.phones.map((phone) => (
              <li key={phone.whatsapp}>
                <a
                  href={`https://wa.me/${phone.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${textStyle} inline-flex items-center gap-2 hover:text-leaf-dark`}
                  aria-label={t("whatsapp", { number: phone.display })}
                >
                  <MessageCircle className="size-4" aria-hidden />
                  <span dir="ltr">{phone.display}</span>
                </a>
              </li>
            ))}
            <li>
              <a
                href={`https://www.instagram.com/${siteConfig.contact.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${textStyle} inline-flex items-center gap-2 hover:text-leaf-dark`}
                aria-label={`${t("instagram")}: ${siteConfig.contact.instagram}`}
              >
                <AtSign className="size-4" aria-hidden />
                <span dir="ltr">{siteConfig.contact.instagram}</span>
              </a>
            </li>
          </ul>
        </section>
      </div>
      <div className="flex flex-col items-center gap-1 border-t border-sage-line py-4 text-center">
        <p className="text-xs text-neutral-800">
          {t("designedBy")}{" "}
          <a href="https://www.sorez.org/" target="_blank" rel="noopener noreferrer" dir="ltr" className="hover:underline">
            <span className="text-accent-blue">So</span>Rez
          </a>
        </p>
        <p className="text-[11px] text-neutral-700">{t("copyright", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
