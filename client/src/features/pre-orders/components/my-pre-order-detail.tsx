"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/form-controls";
import { FormField } from "@/components/ui/form-field";
import { LoadingBlock } from "@/components/ui/spinner";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { canCustomerCancel } from "@/domain";
import { useApiErrorMessage } from "@/hooks/use-api-error";
import { useFormatters } from "@/hooks/use-formatters";
import { Link } from "@/i18n/navigation";
import { isApiError } from "@/lib/api/errors";
import { useCancelPreOrder, useMyPreOrder } from "../hooks";
import { PreOrderHistory } from "./pre-order-history";
import { PreOrderItems } from "./pre-order-items";
import { PreOrderStatusBadge } from "./pre-order-status-badge";

export function MyPreOrderDetail({ id }: { id: string }) {
  const t = useTranslations("myPreOrders");
  const tCommon = useTranslations("common");
  const format = useFormatters();
  const errorMessage = useApiErrorMessage();
  const query = useMyPreOrder(id);
  const cancel = useCancelPreOrder();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (query.isPending) return <LoadingBlock label={tCommon("loading")} />;
  if (query.isError) {
    return isApiError(query.error) && query.error.status === 404 ? (
      <EmptyState title={tCommon("notFoundTitle")} description={tCommon("notFoundDescription")} />
    ) : (
      <ErrorState title={tCommon("errorTitle")} description={errorMessage(query.error)} retryLabel={tCommon("retry")} onRetry={() => query.refetch()} />
    );
  }

  const preOrder = query.data;
  const onCancel = () =>
    cancel.mutate(
      { id: preOrder.id, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          toast.success(t("cancelled"));
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );

  return (
    <div className="space-y-6">
      <Link href="/account/pre-orders" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden /> {t("backToList")}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-md">
        <div className="space-y-1">
          <p className="text-xs text-neutral-500">{t("reference")}</p>
          <p className="font-mono text-xl text-neutral-900" dir="ltr">
            {preOrder.reference}
          </p>
          <p className="text-xs text-neutral-500">
            <time dateTime={preOrder.createdAt}>{format.date(preOrder.createdAt, true)}</time>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <PreOrderStatusBadge status={preOrder.status} />
          <p className="text-sm text-neutral-500">
            {t("total")}: <span className="text-leaf-dark">{format.estimate(preOrder.estimatedTotal)}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section aria-labelledby="items-heading" className="rounded-2xl bg-white p-6 shadow-md lg:col-span-2">
          <h2 id="items-heading" className="mb-4 text-lg text-neutral-900">
            {t("items")}
          </h2>
          <PreOrderItems items={preOrder.items} />
          {preOrder.customerNote ? (
            <div className="mt-6 rounded-lg bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">{t("customerNote")}</p>
              <p className="mt-1 text-sm whitespace-pre-line text-neutral-800">{preOrder.customerNote}</p>
            </div>
          ) : null}
        </section>
        <section aria-labelledby="history-heading" className="rounded-2xl bg-white p-6 shadow-md">
          <h2 id="history-heading" className="mb-4 text-lg text-neutral-900">
            {t("history")}
          </h2>
          <PreOrderHistory history={preOrder.history} audience="customer" />
          {canCustomerCancel(preOrder) ? (
            <Button variant="outline" className="mt-6 w-full border-red-300 text-red-700 hover:border-red-600 hover:bg-red-50" onClick={() => setConfirmOpen(true)}>
              {t("cancel")}
            </Button>
          ) : null}
        </section>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onCancel}
        loading={cancel.isPending}
        title={t("cancelTitle")}
        description={t("cancelBody", { reference: preOrder.reference })}
        confirmLabel={t("cancel")}
        cancelLabel={tCommon("back")}
        closeLabel={tCommon("close")}
      >
        <FormField id="cancel-reason" label={t("cancelReason")} labelStyle="normal">
          <Textarea appearance="boxed" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} />
        </FormField>
      </ConfirmDialog>
    </div>
  );
}
