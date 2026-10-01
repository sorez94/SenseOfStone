import type { Category, ContactMessageInput, PreOrder, Product, User } from "@/domain";

export interface StoredUser extends User {
  /** Mock only. A real backend must store a salted hash (argon2/bcrypt). */
  password: string | null;
}

export interface StoredSession {
  userId: string;
  expiresAt: string;
}

export interface StoredUpload {
  contentType: string;
  bytes: Uint8Array;
}

/** Stored product references its category by id; the `category` ref is resolved on read. */
export type StoredProduct = Omit<Product, "category"> & { categoryId: string };

export interface StoredContactMessage extends ContactMessageInput {
  id: string;
  createdAt: string;
}

export interface MockDatabase {
  users: StoredUser[];
  sessions: Map<string, StoredSession>;
  categories: Omit<Category, "productCount">[];
  products: StoredProduct[];
  preOrders: PreOrder[];
  uploads: Map<string, StoredUpload>;
  contactMessages: StoredContactMessage[];
  sequences: { preOrder: number };
}
