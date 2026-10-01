import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/create-test-app';
import { PrismaService } from 'src/prisma/prisma.service';
import { Availability, MaterialType, PricingType, ProductStatus } from '@prisma/client';

describe('Pre-orders (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const runId = Date.now();
  const customerEmail = `e2e-preorder-${runId}@example.com`;
  const incompleteEmail = `e2e-incomplete-${runId}@example.com`;
  const password = 'supersecret123';

  let categoryId: string;
  let productId: string;
  let draftProductId: string;
  let accessToken: string;
  let incompleteAccessToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    const category = await prisma.category.create({
      data: { slug: `e2e-cat-${runId}`, name: { en: 'E2E Category' }, sortOrder: 999 },
    });
    categoryId = category.id;

    const product = await prisma.product.create({
      data: {
        slug: `e2e-product-${runId}`,
        sku: `E2E-${runId}`,
        title: { en: 'E2E Test Product' },
        shortDescription: { en: 'Test' },
        description: { en: 'Test description' },
        categoryId,
        materialType: MaterialType.WOOD,
        material: { en: 'Pine' },
        pricingType: PricingType.FIXED,
        priceAmount: 1_000_000,
        referencePrice: 1_000_000,
        availability: Availability.IN_STOCK,
        preOrderEnabled: true,
        preOrderMinQuantity: 1,
        preOrderMaxQuantity: 5,
        status: ProductStatus.PUBLISHED,
      },
    });
    productId = product.id;

    const draftProduct = await prisma.product.create({
      data: {
        slug: `e2e-draft-${runId}`,
        sku: `E2E-DRAFT-${runId}`,
        title: { en: 'E2E Draft Product' },
        shortDescription: { en: 'Test' },
        description: { en: 'Test description' },
        categoryId,
        materialType: MaterialType.WOOD,
        material: { en: 'Pine' },
        pricingType: PricingType.FIXED,
        priceAmount: 500_000,
        referencePrice: 500_000,
        availability: Availability.IN_STOCK,
        preOrderEnabled: true,
        preOrderMinQuantity: 1,
        preOrderMaxQuantity: 5,
        status: ProductStatus.DRAFT,
      },
    });
    draftProductId = draftProduct.id;

    await request(app.getHttpServer()).post('/v1/auth/register').send({ email: customerEmail, password });
    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: customerEmail, password });
    accessToken = loginRes.body.data.accessToken;

    await request(app.getHttpServer())
      .put('/v1/me/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        firstName: 'Test',
        lastName: 'Customer',
        phone: '09121234567',
        address: { city: 'Tehran', line: 'Some long enough address line' },
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email: incompleteEmail, password });
    const incompleteLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: incompleteEmail, password });
    incompleteAccessToken = incompleteLoginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.preOrder.deleteMany({ where: { customerSnapshot: { path: ['email'], equals: customerEmail } } });
    await prisma.product.deleteMany({ where: { id: { in: [productId, draftProductId] } } });
    await prisma.category.delete({ where: { id: categoryId } });
    await prisma.user.deleteMany({ where: { email: { in: [customerEmail, incompleteEmail] } } });
    await app.close();
  });

  it('rejects pre-order creation for a user with an incomplete profile (403 PROFILE_INCOMPLETE)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/pre-orders')
      .set('Authorization', `Bearer ${incompleteAccessToken}`)
      .send({ items: [{ productId, quantity: 1 }] })
      .expect(403);

    expect(res.body.error.code).toBe('PROFILE_INCOMPLETE');
  });

  it('rejects pre-ordering a draft (non-preorderable) product with 422 PRODUCT_NOT_PREORDERABLE', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/pre-orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ items: [{ productId: draftProductId, quantity: 1 }] })
      .expect(422);

    expect(res.body.error.code).toBe('PRODUCT_NOT_PREORDERABLE');
    expect(res.body.error.details[0].field).toBe('items.0.productId');
  });

  it('rejects a quantity outside the product preOrder range', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/pre-orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ items: [{ productId, quantity: 99 }] })
      .expect(422);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('items.0.quantity');
  });

  let preOrderId: string;
  let reference: string;

  it('creates a pre-order atomically with a snapshotted price and a unique reference', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/pre-orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ items: [{ productId, quantity: 2 }], customerNote: 'Please call first' })
      .expect(201);

    const preOrder = res.body.data;
    expect(preOrder.status).toBe('pending');
    expect(preOrder.reference).toMatch(/^PO-\d{4}-\d{5}$/);
    expect(preOrder.estimatedTotal).toEqual({ min: 2_000_000, max: 2_000_000 });
    expect(preOrder.items).toHaveLength(1);
    expect(preOrder.items[0].unitPrice).toEqual({ type: 'fixed', amount: 1_000_000 });
    expect(preOrder.adminNote).toBeNull();

    preOrderId = preOrder.id;
    reference = preOrder.reference;
  });

  it('lists the pre-order under "my pre-orders"', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/pre-orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.some((po: { reference: string }) => po.reference === reference)).toBe(true);
    expect(res.body.meta.page).toBe(1);
  });

  it("returns 404 (not 403) for another customer's pre-order", async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/pre-orders/${preOrderId}`)
      .set('Authorization', `Bearer ${incompleteAccessToken}`)
      .expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('cancels the pending pre-order', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/pre-orders/${preOrderId}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reason: 'Changed my mind' })
      .expect(200);

    expect(res.body.data.status).toBe('cancelled');
    expect(res.body.data.history).toHaveLength(2);
    expect(res.body.data.history[1].changedBy).toBe('customer');
  });

  it('rejects cancelling an already-cancelled pre-order with 409 INVALID_STATUS_TRANSITION', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/pre-orders/${preOrderId}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409);

    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });
});
