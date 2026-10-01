import { ProductEditView } from "@/features/admin/components/products/product-editor-view";

export default async function AdminEditProductPage({ params }: PageProps<"/[locale]/admin/products/[id]/edit">) {
  const { id } = await params;
  return <ProductEditView id={id} />;
}
