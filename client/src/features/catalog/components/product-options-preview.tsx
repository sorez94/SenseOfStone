import { useTranslations } from "next-intl";
import type { ProductOption } from "@/domain";
import { useFormatters } from "@/hooks/use-formatters";
import { useLocalize } from "@/hooks/use-localize";

/** Read-only list of an item's configurable options on the product page. */
export function ProductOptionsPreview({ options }: { options: ProductOption[] }) {
  const t = useTranslations("product");
  const text = useLocalize();
  const format = useFormatters();
  if (!options.length) return null;

  return (
    <div>
      <h2 className="mb-3 text-lg text-neutral-900">{t("options")}</h2>
      <dl className="space-y-3">
        {options.map((option) => (
          <div key={option.id}>
            <dt className="text-xs tracking-wide text-neutral-500 uppercase rtl:tracking-normal">{text(option.name)}</dt>
            <dd className="mt-1.5 flex flex-wrap gap-2">
              {option.values.map((value) => (
                <span key={value.id} className="rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-700">
                  {text(value.label)}
                  {value.priceDelta !== 0 ? (
                    <span className="ms-1 text-xs text-neutral-500">
                      ({value.priceDelta > 0
                        ? t("priceDelta", { amount: format.amount(value.priceDelta) })
                        : t("priceDeltaNegative", { amount: format.amount(-value.priceDelta) })})
                    </span>
                  ) : null}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
