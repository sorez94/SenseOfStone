import type { ApiClient } from "@/lib/api/client";
import { createAdminService } from "./admin.service";
import { createAuthService } from "./auth.service";
import { createCatalogService } from "./catalog.service";
import { createContactService } from "./contact.service";
import { createPreOrdersService } from "./pre-orders.service";
import { createProfileService } from "./profile.service";

/** Composition root for all API services. The UI depends on this shape only. */
export function createServices(api: ApiClient) {
  return {
    auth: createAuthService(api),
    profile: createProfileService(api),
    catalog: createCatalogService(api),
    contact: createContactService(api),
    preOrders: createPreOrdersService(api),
    admin: createAdminService(api),
  };
}

export type Services = ReturnType<typeof createServices>;
export type { UploadedFile } from "./admin.service";
