import { PreOrderDetailView } from "@/features/admin/components/pre-orders/pre-order-detail-view";

export default async function AdminPreOrderPage({ params }: PageProps<"/[locale]/admin/pre-orders/[id]">) {
  const { id } = await params;
  return <PreOrderDetailView id={id} />;
}
