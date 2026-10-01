import { ProductDetailView } from "@/features/admin/components/products/product-detail-view";

export default async function AdminProductPage({ params }: PageProps<"/[locale]/admin/products/[id]">) {
  const { id } = await params;
  return <ProductDetailView id={id} />;
}
