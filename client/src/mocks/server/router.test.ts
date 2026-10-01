import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { AuthSession, PreOrder, Product, ProductSummary, User } from "@/domain";
import { ApiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { createServices } from "@/services";
import { resetDb } from "../db/store";
import { encodeMockGoogleToken } from "../google-token";
import { InProcessTransport } from "../in-process-transport";

/** Exercises the fake backend through the real ApiClient + services, i.e. the frontend's contract. */
function servicesWithToken(token?: string) {
  return createServices(new ApiClient({ transport: new InProcessTransport(), getAccessToken: () => token }));
}

async function signIn(email: string, password: string): Promise<AuthSession> {
  return servicesWithToken().auth.login({ email, password });
}

beforeEach(() => {
  resetDb();
});

describe("catalog", () => {
  it("lists only published products with pagination meta", async () => {
    const page = await servicesWithToken().catalog.listProducts({ pageSize: 5 });
    expect(page.items).toHaveLength(5);
    expect(page.meta.total).toBeGreaterThan(5);
    expect(page.items.every((p: ProductSummary) => p.status === "published")).toBe(true);
  });

  it("filters, searches and sorts", async () => {
    const { catalog } = servicesWithToken();
    const wood = await catalog.listProducts({ materialType: "wood" });
    expect(wood.items.every((p) => p.materialType === "wood")).toBe(true);

    const search = await catalog.listProducts({ q: "onyx" });
    expect(search.items.length).toBeGreaterThan(0);

    const byPrice = await catalog.listProducts({ sort: "price_asc", pageSize: 50 });
    const prices = byPrice.items.map((p) => (p.pricing.type === "fixed" ? p.pricing.amount : p.pricing.type === "range" ? p.pricing.min : Infinity));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("returns 404 for drafts and unknown slugs", async () => {
    await expect(servicesWithToken().catalog.getProductBySlug("teak-planter-box")).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("auth & profile", () => {
  it("creates a Google user with an incomplete profile, then completes it", async () => {
    const session = await servicesWithToken().auth.signInWithGoogle({
      idToken: encodeMockGoogleToken({ email: "new@gmail.com", given_name: "Nima" }),
    });
    expect(session.user.isProfileComplete).toBe(false);
    expect(session.user.profile?.firstName).toBe("Nima");

    const services = servicesWithToken(session.accessToken);
    const user: User = await services.profile.complete({
      firstName: "Nima",
      lastName: "Karimi",
      phone: "09121112233",
      address: { city: "Tehran", line: "Enghelab St. 10" },
    });
    expect(user.isProfileComplete).toBe(true);
  });

  it("rejects bad credentials and duplicate registration", async () => {
    await expect(signIn("customer@example.com", "nope")).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    await expect(servicesWithToken().auth.register({ email: "customer@example.com", password: "password123" })).rejects.toMatchObject({
      code: "EMAIL_TAKEN",
      status: 409,
    });
  });
});

describe("pre-orders", () => {
  it("blocks users with incomplete profiles", async () => {
    const session = await servicesWithToken().auth.register({ email: "fresh@example.com", password: "password123" });
    const error = await servicesWithToken(session.accessToken)
      .preOrders.create({ items: [{ productId: "prd_luna_coffee", quantity: 1, options: { opt_luna_finish: "val_luna_honed" } }] })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("PROFILE_INCOMPLETE");
  });

  it("validates options & quantity, creates, lists and cancels", async () => {
    const { accessToken } = await signIn("customer@example.com", "customer1234");
    const services = servicesWithToken(accessToken);

    await expect(services.preOrders.create({ items: [{ productId: "prd_nature_dining", quantity: 1, options: {} }] })).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: [expect.objectContaining({ field: "items.0.options.opt_nature_size" })],
    });
    await expect(
      services.preOrders.create({ items: [{ productId: "prd_nature_dining", quantity: 99, options: { opt_nature_size: "val_nature_220" } }] }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    const created: PreOrder = await services.preOrders.create({
      items: [{ productId: "prd_nature_dining", quantity: 2, options: { opt_nature_size: "val_nature_220" } }],
      customerNote: "Please call before delivery",
    });
    expect(created.status).toBe("pending");
    expect(created.reference).toMatch(/^PO-\d{4}-\d{5}$/);
    expect(created.estimatedTotal).toEqual({ min: 2 * 210_000_000, max: 2 * 265_000_000 });
    expect(created.customer.phone).toBe("09121234567");

    const mine = await services.preOrders.listMine();
    expect(mine.items[0]?.id).toBe(created.id);

    const cancelled = await services.preOrders.cancel(created.id);
    expect(cancelled.status).toBe("cancelled");
    await expect(services.preOrders.cancel(created.id)).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });
  });

  it("rejects discontinued products", async () => {
    const { accessToken } = await signIn("customer@example.com", "customer1234");
    await expect(
      servicesWithToken(accessToken).preOrders.create({ items: [{ productId: "prd_marble_mirror", quantity: 1, options: {} }] }),
    ).rejects.toMatchObject({ code: "PRODUCT_NOT_PREORDERABLE" });
  });
});

describe("contact", () => {
  it("accepts a public message and validates fields", async () => {
    const { contact } = servicesWithToken();
    const receipt = await contact.send({ name: "Sara", email: "sara@example.com", message: "Do you ship to Shiraz?" });
    expect(receipt.id).toMatch(/^msg_/);

    await expect(contact.send({ name: "S", email: "not-an-email", message: "Hi" })).rejects.toMatchObject({
      status: 422,
      code: "VALIDATION_ERROR",
      details: expect.arrayContaining([
        expect.objectContaining({ field: "name" }),
        expect.objectContaining({ field: "email" }),
        expect.objectContaining({ field: "message" }),
      ]),
    });
  });
});

describe("admin", () => {
  it("forbids customers and allows admins", async () => {
    const customer = await signIn("customer@example.com", "customer1234");
    await expect(servicesWithToken(customer.accessToken).admin.getDashboard()).rejects.toMatchObject({ status: 403 });
    await expect(servicesWithToken().admin.getDashboard()).rejects.toMatchObject({ status: 401 });

    const admin = await signIn("admin@senseofstone.com", "admin1234");
    const stats = await servicesWithToken(admin.accessToken).admin.getDashboard();
    expect(stats.products.total).toBeGreaterThan(0);
  });

  it("creates, updates, publishes and deletes a product", async () => {
    const { accessToken } = await signIn("admin@senseofstone.com", "admin1234");
    const { admin, catalog } = servicesWithToken(accessToken);
    const existing: Product = await admin.products.get("prd_luna_coffee");
    const { id: _id, category, createdAt: _c, updatedAt: _u, currency: _cur, ...rest } = existing;

    const created = await admin.products.create({ ...rest, categoryId: category.id, slug: "luna-copy", sku: "SOS-COPY", status: "draft" });
    await expect(catalog.getProductBySlug("luna-copy")).rejects.toMatchObject({ status: 404 });

    await admin.products.setStatus(created.id, "published");
    expect((await catalog.getProductBySlug("luna-copy")).id).toBe(created.id);

    await expect(admin.products.create({ ...rest, categoryId: category.id, slug: "luna-copy", sku: "OTHER" })).rejects.toMatchObject({
      code: "SLUG_TAKEN",
    });

    const options = await admin.products.replaceOptions(created.id, [
      { name: { en: "Edge" }, required: false, values: [{ label: { en: "Bullnose" }, priceDelta: 100 }] },
    ]);
    expect(options[0]?.id).toBeTruthy();

    await admin.products.remove(created.id);
    await expect(admin.products.get(created.id)).rejects.toMatchObject({ status: 404 });
  });

  it("enforces pre-order status transitions and category deletion rules", async () => {
    const { accessToken } = await signIn("admin@senseofstone.com", "admin1234");
    const { admin } = servicesWithToken(accessToken);
    await expect(admin.preOrders.updateStatus("po_seed_3", { status: "completed" })).rejects.toMatchObject({
      code: "INVALID_STATUS_TRANSITION",
    });
    const confirmed = await admin.preOrders.updateStatus("po_seed_3", { status: "confirmed", note: "OK" });
    expect(confirmed.history.at(-1)).toMatchObject({ status: "confirmed", changedBy: "admin", note: "OK" });

    await expect(admin.categories.remove("cat_tables")).rejects.toMatchObject({ code: "CATEGORY_NOT_EMPTY" });
  });
});
