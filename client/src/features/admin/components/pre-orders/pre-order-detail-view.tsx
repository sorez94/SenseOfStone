"use client";

import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/form-controls";
import { FormField } from "@/components/ui/form-field";
import { LoadingBlock } from "@/components/ui/spinner";
import { Alert, ErrorState } from "@/components/ui/states";
import { allowedNextStatuses, type PreOrder, type PreOrderStatus } from "@/domain";
import { PreOrderHistory } from "@/features/pre-orders/components/pre-order-history";
import { PreOrderItems } from "@/features/pre-orders/components/pre-order-items";
import { PreOrderStatusBadge } from "@/features/pre-orders/components/pre-order-status-badge";
import { useApiErrorMessage } from "@/hooks/use-api-error";
import { useFormatters } from "@/hooks/use-formatters";
import { Link } from "@/i18n/navigation";
import { useAdminPreOrder, useUpdatePreOrderNote, useUpdatePreOrderStatus } from "../../hooks";
import { AdminCard, AdminPageHeader } from "../admin-page-header";

export function PreOrderDetailView({ id }: { id: string }) {
  const t = useTranslations("admin.preOrders");
  const tCommon = useTranslations("common");
  const format = useFormatters();
  const errorMessage = useApiErrorMessage();
  const query = useAdminPreOrder(id);

  if (query.isPending) return <LoadingBlock label={tCommon("loading")} />;
  if (query.isError) return <ErrorState title={tCommon("errorTitle")} description={errorMessage(query.error)} retryLabel={tCommon("retry")} onRetry={() => query.refetch()} />;

  const preOrder = query.data;
  const { customer } = preOrder;

  return (
    <>
      <Link href="/admin/pre-orders" className="mb-3 inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden /> {t("backToList")}
      </Link>
      <AdminPageHeader
        title={t("detailTitle", { reference: preOrder.reference })}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <PreOrderStatusBadge status={preOrder.status} />
            <time dateTime={preOrder.createdAt}>{format.date(preOrder.createdAt, true)}</time>
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <AdminCard title={t("orderedProducts")}>
            <PreOrderItems items={preOrder.items} />
            <div className="mt-4 flex justify-between border-t border-neutral-100 pt-4 text-sm">
              <span className="text-neutral-500">{t("total")}</span>
              <span className="text-leaf-dark">{format.estimate(preOrder.estimatedTotal)}</span>
            </div>
          </AdminCard>
          {preOrder.customerNote ? (
            <AdminCard title={t("customerNote")}>
              <p className="text-sm whitespace-pre-line text-neutral-700">{preOrder.customerNote}</p>
            </AdminCard>
          ) : null}
          <AdminCard title={t("history")}>
            <PreOrderHistory history={preOrder.history} audience="admin" />
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title={t("customerInfo")}>
            <p className="text-neutral-900">
              {customer.firstName} {customer.lastName}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-neutral-400" aria-label={t("email")} />
                <a href={`mailto:${customer.email}`} className="truncate hover:underline" dir="ltr">
                  {customer.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-neutral-400" aria-label={t("phone")} />
                <a href={`tel:${customer.phone}`} className="hover:underline" dir="ltr">
                  {customer.phone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-400" aria-label={t("address")} />
                <span>
                  {customer.address.city} — {customer.address.line}
                  {customer.address.postalCode ? (
                    <span className="block text-xs text-neutral-500" dir="ltr">
                      {customer.address.postalCode}
                    </span>
                  ) : null}
                </span>
              </li>
            </ul>
          </AdminCard>
          <StatusChanger preOrder={preOrder} />
          <AdminNoteEditor preOrder={preOrder} />
        </div>
      </div>
    </>
  );
}

function StatusChanger({ preOrder }: { preOrder: PreOrder }) {
  const t = useTranslations("admin.preOrders");
  const tStatus = useTranslations("preOrderStatus");
  const errorMessage = useApiErrorMessage();
  const options = allowedNextStatuses(preOrder.status);
  const [status, setStatus] = useState<PreOrderStatus | "">(options[0] ?? "");
  const [note, setNote] = useState("");
  const mutation = useUpdatePreOrderStatus(preOrder.id);

  // Keep the selection valid after a transition changes the allowed options.
  const selected = status && options.includes(status) ? status : (options[0] ?? "");

  return (
    <AdminCard title={t("changeStatus")}>
      {options.length === 0 ? (
        <Alert>{t("noTransitions")}</Alert>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!selected) return;
            mutation.mutate(
              { status: selected, note: note.trim() || undefined },
              {
                onSuccess: () => {
                  toast.success(t("statusUpdated"));
                  setNote("");
                },
                onError: (error) => toast.error(errorMessage(error)),
              },
            );
          }}
        >
          <FormField id="admin-status" labelStyle="normal" label={t("newStatus")}>
            <Select value={selected} onChange={(event) => setStatus(event.target.value as PreOrderStatus)}>
              {options.map((value) => (
                <option key={value} value={value}>
                  {tStatus(value)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="admin-status-note" labelStyle="normal" label={t("statusNote")}>
            <Textarea appearance="boxed" rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} />
          </FormField>
          <Button type="submit" className="w-full" loading={mutation.isPending}>
            {t("updateStatus")}
          </Button>
        </form>
      )}
    </AdminCard>
  );
}

function AdminNoteEditor({ preOrder }: { preOrder: PreOrder }) {
  const t = useTranslations("admin.preOrders");
  const tCommon = useTranslations("common");
  const errorMessage = useApiErrorMessage();
  const [note, setNote] = useState(preOrder.adminNote ?? "");
  const mutation = useUpdatePreOrderNote(preOrder.id);
  const dirty = note.trim() !== (preOrder.adminNote ?? "");

  return (
    <AdminCard title={t("adminNote")}>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate(
            { adminNote: note.trim() || null },
            { onSuccess: () => toast.success(t("noteSaved")), onError: (error) => toast.error(errorMessage(error)) },
          );
        }}
      >
        <FormField id="admin-note" labelStyle="normal" label={t("adminNote")} hint={t("adminNoteHint")} className="[&>label]:sr-only">
          <Textarea appearance="boxed" rows={4} maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} />
        </FormField>
        <Button type="submit" variant="outline" className="w-full" disabled={!dirty} loading={mutation.isPending}>
          {tCommon("save")}
        </Button>
      </form>
    </AdminCard>
  );
}
