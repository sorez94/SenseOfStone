import { useTranslations } from "next-intl";
import type { Product } from "@/domain";
import { useFormatters } from "@/hooks/use-formatters";
import { useLocalize } from "@/hooks/use-localize";

/** Specification table combining structured fields (material, dimensions…) and free-form specs. */
export function ProductSpecifications({ product }: { product: Product }) {
  const t = useTranslations("product");
  const tMaterial = useTranslations("materialType");
  const text = useLocalize();
  const format = useFormatters();
  const { length, width, height, weight } = product.dimensions;
  const cm = (value: number | null) => (value === null ? null : t("cm", { value: format.number(value) }));

  const rows: Array<[string, string | null]> = [
    [t("sku"), product.sku],
    [t("category"), text(product.category.name)],
    [t("materialType"), tMaterial(product.materialType)],
    [t("material"), text(product.material)],
    [t("finish"), product.finish ? text(product.finish) : null],
    [t("origin"), product.origin ? text(product.origin) : null],
    [t("length"), cm(length)],
    [t("width"), cm(width)],
    [t("height"), cm(height)],
    [t("weight"), weight === null ? null : t("kg", { value: format.number(weight) })],
    ...product.specifications.map((spec): [string, string] => [text(spec.label), text(spec.value)]),
  ];

  return (
    <table className="w-full border border-neutral-200 text-start text-sm text-neutral-700">
      <caption className="sr-only">{t("specifications")}</caption>
      <tbody>
        {rows
          .filter((row): row is [string, string] => Boolean(row[1]))
          .map(([label, value]) => (
            <tr key={label} className="border-b border-neutral-200 last:border-0 odd:bg-neutral-50/60">
              <th scope="row" className="w-2/5 p-2.5 text-start font-medium text-neutral-800">
                {label}
              </th>
              <td className="p-2.5">{value}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
