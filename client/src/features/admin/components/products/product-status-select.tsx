"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Select } from "@/components/ui/form-controls";
import { productStatuses, type ProductStatus } from "@/domain";
import { useApiErrorMessage } from "@/hooks/use-api-error";
import { useSetProductStatus } from "../../hooks";

/** Inline status changer used in the product list and detail view. */
export function ProductStatusSelect({ id, status, name }: { id: string; status: ProductStatus; name: string }) {
  const t = useTranslations("productStatus");
  const tProducts = useTranslations("admin.products");
  const errorMessage = useApiErrorMessage();
  const mutation = useSetProductStatus();

  return (
    <Select
      value={status}
      disabled={mutation.isPending}
      aria-label={tProducts("changeStatus", { name })}
      onChange={(event) =>
        mutation.mutate(
          { id, status: event.target.value as ProductStatus },
          { onSuccess: () => toast.success(tProducts("statusChanged")), onError: (error) => toast.error(errorMessage(error)) },
        )
      }
      className="h-8 w-36 py-1 text-xs"
    >
      {productStatuses.map((value) => (
        <option key={value} value={value}>
          {t(value)}
        </option>
      ))}
    </Select>
  );
}
