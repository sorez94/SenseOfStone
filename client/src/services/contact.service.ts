import type { ContactMessageInput, ContactMessageReceipt } from "@/domain";
import type { ApiClient } from "@/lib/api/client";

/** Public contact form. */
export function createContactService(api: ApiClient) {
  return {
    send: (input: ContactMessageInput) => api.post<ContactMessageReceipt>("/contact", input),
  };
}

export type ContactService = ReturnType<typeof createContactService>;
