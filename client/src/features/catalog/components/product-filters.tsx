"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import Form from "next/form";
import { useLocale, useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import { Checkbox, Input, Select } from "@/components/ui/form-controls";
import { availabilityStatuses, materialTypes, productSorts, type Category, type ProductListQuery } from "@/domain";
import { useLocalize } from "@/hooks/use-localize";
import { getPathname, Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { hasActiveFilters } from "../search-params";

interface ProductFiltersProps {
  query: ProductListQuery;
  categories: Category[];
}

/**
 * Filter/search/sort form. It is a plain GET form (works without JavaScript); with JS,
 * `next/form` navigates client-side and select/checkbox changes submit immediately.
 */
export function ProductFilters({ query, categories }: ProductFiltersProps) {
  const t = useTranslations("catalog");
  const tMaterial = useTranslations("materialType");
  const tAvailability = useTranslations("availability");
  const tSort = useTranslations("sort");
  const locale = useLocale();
  const text = useLocalize();
  const formRef = useRef<HTMLFormElement>(null);
  const panelId = useId();
  const [panelOpen, setPanelOpen] = useState(false);
  const action = getPathname({ href: "/products", locale });
  const submit = () => formRef.current?.requestSubmit();

  // Re-mount inputs when the URL query changes so defaultValues stay in sync (e.g. "Reset").
  const formKey = JSON.stringify(query);

  return (
    <Form key={formKey} ref={formRef} action={action} className="flex flex-col gap-4" role="search" aria-label={t("searchLabel")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <label htmlFor="catalog-q" className="sr-only">
            {t("searchLabel")}
          </label>
          <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            id="catalog-q"
            name="q"
            type="search"
            appearance="boxed"
            defaultValue={query.q}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <div className="flex gap-3">
          <label className="sr-only" htmlFor="catalog-sort">
            {t("sort")}
          </label>
          <Select id="catalog-sort" name="sort" defaultValue={query.sort ?? "newest"} onChange={submit} className="min-w-44">
            {productSorts.map((sort) => (
              <option key={sort} value={sort}>
                {tSort(sort)}
              </option>
            ))}
          </Select>
          <Button
            variant="outline"
            className="md:hidden"
            aria-expanded={panelOpen}
            aria-controls={panelId}
            onClick={() => setPanelOpen((open) => !open)}
            icon={<SlidersHorizontal className="size-4" aria-hidden />}
          >
            {panelOpen ? t("hideFilters") : t("showFilters")}
          </Button>
          <Button type="submit" variant="primary" className="hidden sm:inline-flex">
            {t("apply")}
          </Button>
        </div>
      </div>

      <fieldset id={panelId} className={cn("grid grid-cols-1 gap-4 rounded-xl border border-neutral-100 bg-neutral-50/60 p-4 sm:grid-cols-2 lg:grid-cols-4", !panelOpen && "max-md:hidden")}>
        <legend className="sr-only">{t("filters")}</legend>
        <FilterSelect label={t("category")} name="category" defaultValue={query.category} onChange={submit}>
          <option value="">{t("allCategories")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {text(category.name)} ({category.productCount})
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label={t("materialType")} name="materialType" defaultValue={query.materialType} onChange={submit}>
          <option value="">{t("anyMaterial")}</option>
          {materialTypes.map((type) => (
            <option key={type} value={type}>
              {tMaterial(type)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label={t("availability")} name="availability" defaultValue={query.availability} onChange={submit}>
          <option value="">{t("anyAvailability")}</option>
          {availabilityStatuses.map((status) => (
            <option key={status} value={status}>
              {tAvailability(status)}
            </option>
          ))}
        </FilterSelect>
        <div className="flex flex-col">
          <span className="mb-1.5 text-xs font-semibold tracking-wide text-neutral-700 uppercase rtl:tracking-normal" id="price-label">
            {t("priceRange")}
          </span>
          <div className="flex gap-2" role="group" aria-labelledby="price-label">
            <Input name="minPrice" type="number" min={0} step={100000} inputMode="numeric" appearance="boxed" aria-label={t("minPrice")} placeholder={t("minPrice")} defaultValue={query.minPrice} />
            <Input name="maxPrice" type="number" min={0} step={100000} inputMode="numeric" appearance="boxed" aria-label={t("maxPrice")} placeholder={t("maxPrice")} defaultValue={query.maxPrice} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:col-span-2 lg:col-span-4">
          <Checkbox id="catalog-preorder" name="preOrderOnly" value="true" defaultChecked={query.preOrderOnly} onChange={submit} label={t("preOrderOnly")} />
          <Checkbox id="catalog-featured" name="featured" value="true" defaultChecked={query.featured} onChange={submit} label={t("featuredOnly")} />
          <div className="ms-auto flex gap-2">
            {hasActiveFilters(query) ? (
              <Link href="/products" className={buttonStyles({ variant: "ghost", size: "sm" })}>
                {t("reset")}
              </Link>
            ) : null}
            <Button type="submit" size="sm" className="sm:hidden">
              {t("apply")}
            </Button>
          </div>
        </div>
      </fieldset>
    </Form>
  );
}

function FilterSelect({
  label,
  name,
  defaultValue,
  onChange,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  onChange: () => void;
  children: React.ReactNode;
}) {
  const id = `catalog-${name}`;
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1.5 text-xs font-semibold tracking-wide text-neutral-700 uppercase rtl:tracking-normal">
        {label}
      </label>
      <Select id={id} name={name} defaultValue={defaultValue ?? ""} onChange={onChange}>
        {children}
      </Select>
    </div>
  );
}
