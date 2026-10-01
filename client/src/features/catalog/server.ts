import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Product } from "@/domain";
import { isApiError } from "@/lib/api/errors";
import { getServerServices } from "@/lib/api/server";

/** Loads a published product by slug (deduplicated per request); 404s when missing. */
export const getProductBySlugOrNotFound = cache(async (slug: string): Promise<Product> => {
  try {
    return await getServerServices().catalog.getProductBySlug(slug);
  } catch (error) {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  }
});
