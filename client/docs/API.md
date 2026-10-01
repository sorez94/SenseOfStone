# Sense Of Stone — Backend API Specification (v1)

This document is the contract between the **new-sos** frontend and the future backend.
The frontend already runs against a fake backend (`src/mocks`) that implements this spec, so
a real backend that follows it can be swapped in by setting:

```
NEXT_PUBLIC_API_MODE=http
NEXT_PUBLIC_API_BASE_URL=https://api.example.com/v1
```

The TypeScript types referenced below live in `src/domain/*.ts` and are the source of truth
for field names. Validation rules are implemented in `src/mocks/server/schemas.ts`.

---

## Table of contents

1. [Conventions](#1-conventions)
2. [Data models](#2-data-models)
3. [Authentication & profile](#3-authentication--profile)
4. [Catalog & contact (public)](#4-catalog--contact-public)
5. [Pre-orders (customer)](#5-pre-orders-customer)
6. [Admin](#6-admin)
7. [Endpoint summary](#7-endpoint-summary)
8. [Implementation notes for the backend](#8-implementation-notes-for-the-backend)

---

## 1. Conventions

### 1.1 Base URL & versioning
All paths are relative to the base URL, e.g. `https://api.senseofstone.com/v1`. Breaking changes require `/v2`.

### 1.2 Format
* Request and response bodies are JSON (`Content-Type: application/json; charset=utf-8`), except file uploads (`multipart/form-data`) and file downloads.
* Field names are `camelCase`. Dates are ISO-8601 UTC strings (`2026-09-30T10:00:00.000Z`).
* IDs are opaque strings. The frontend never parses them.
* Money is an **integer amount in Iranian Toman** (`currency: "IRT"`). No floating point.

### 1.3 Localized content
Translatable content uses `LocalizedText`:

```json
{ "en": "Luna Coffee Table", "fa": "میز جلومبلی لونا" }
```

`en` is required; other locales are optional and the UI falls back to `en`. The API always returns **all** translations (the admin edits all of them; the storefront picks one). Adding a new language = adding a new key; no API change needed.

The client sends `Accept-Language: en|fa`. It only affects locale-sensitive **sorting** (e.g. `sort=title_asc`) and optional human-readable `error.message` text.

### 1.4 Success envelope

Single resource:
```json
{ "data": { ... } }
```

Collection (paginated):
```json
{
  "data": [ ... ],
  "meta": { "page": 1, "pageSize": 12, "total": 57, "totalPages": 5 }
}
```

Non-paginated list: `{ "data": [ ... ] }` (no `meta`).

`204 No Content` has an empty body.

### 1.5 Pagination
Query parameters `page` (1-based, default `1`) and `pageSize` (default varies per endpoint, max `100`).
If `page` is greater than `totalPages`, the last page is returned.

### 1.6 Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "address.city", "code": "too_small", "message": "Too small: expected string to have >=2 characters" }
    ]
  }
}
```

* `code` — stable machine-readable code (below). The UI translates codes, **not** messages.
* `message` — developer-facing text; may be shown as a fallback.
* `details` — optional; for field errors. `field` is a dot path into the request body (e.g. `items.0.quantity`, `items.0.options.opt_123`).

| HTTP | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Malformed JSON |
| 401 | `UNAUTHENTICATED` | Missing/invalid/expired token |
| 401 | `INVALID_CREDENTIALS` | Wrong email/password |
| 401 | `INVALID_GOOGLE_TOKEN` | Google ID token rejected |
| 403 | `FORBIDDEN` | Authenticated but lacks role |
| 403 | `PROFILE_INCOMPLETE` | Action requires a complete profile |
| 404 | `NOT_FOUND` | Resource does not exist or is not visible to caller |
| 409 | `CONFLICT` | Generic uniqueness conflict (e.g. SKU) |
| 409 | `EMAIL_TAKEN` | Registration with existing email |
| 409 | `SLUG_TAKEN` | Product/category slug in use |
| 409 | `CATEGORY_NOT_EMPTY` | Deleting a category that still has products |
| 409 | `INVALID_STATUS_TRANSITION` | Pre-order status change not allowed |
| 413 | `PAYLOAD_TOO_LARGE` | Upload > 5 MB |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Upload is not an allowed image type |
| 422 | `VALIDATION_ERROR` | Body failed validation (see `details`) |
| 422 | `PRODUCT_NOT_PREORDERABLE` | Product not published / pre-order disabled / discontinued |
| 429 | `RATE_LIMITED` | Too many requests (include `Retry-After` header) |
| 500 | `INTERNAL_ERROR` | Unexpected failure |

### 1.7 Authentication
* Bearer tokens: `Authorization: Bearer <accessToken>`.
* Tokens are returned by the auth endpoints together with `expiresAt`. Suggested lifetime: 7 days (or short-lived access token + refresh token, see §8).
* Endpoints are marked **Public**, **Customer** (any authenticated user) or **Admin** (`role = "admin"`).
* Admins are regular users with `role: "admin"`; they log in through the same endpoints.

---

## 2. Data models

TypeScript definitions: `src/domain`. JSON examples below are normative.

### 2.1 User (`User`)

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `email` | string | Unique, case-insensitive |
| `role` | `"customer" \| "admin"` | |
| `authProvider` | `"google" \| "password"` | Provider used to create the account |
| `avatarUrl` | string \| null | From Google `picture`, or set/cleared via §3.8 |
| `profile` | `Partial<Profile>` \| null | May be partially pre-filled from Google (`given_name`, `family_name`) |
| `isProfileComplete` | boolean | Computed by the backend — see rule below |
| `createdAt`, `updatedAt` | datetime | |

`Profile`:

| Field | Type | Rules |
|---|---|---|
| `firstName` | string | required, trimmed, 2–60 chars |
| `lastName` | string | required, trimmed, 2–60 chars |
| `phone` | string | required, `^\+?[0-9]{10,14}$` (e.g. `09121234567`, `+989121234567`) |
| `address.city` | string | required, 2–80 chars |
| `address.line` | string | required, 5–300 chars |
| `address.postalCode` | string | optional, exactly 10 digits |

**Rule:** `isProfileComplete = firstName && lastName && phone && address.city && address.line` (all non-blank).

```json
{
  "id": "usr_customer",
  "email": "customer@example.com",
  "role": "customer",
  "authProvider": "password",
  "avatarUrl": null,
  "profile": {
    "firstName": "Ali",
    "lastName": "Rezaei",
    "phone": "09121234567",
    "address": { "city": "Tehran", "line": "Valiasr St., No. 12", "postalCode": "1234567890" }
  },
  "isProfileComplete": true,
  "createdAt": "2026-07-02T00:00:00.000Z",
  "updatedAt": "2026-07-02T00:00:00.000Z"
}
```

`AuthSession`: `{ "accessToken": string, "expiresAt": datetime, "user": User }`.

### 2.2 Category (`Category`)

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `slug` | string | Unique, `^[a-z0-9]+(-[a-z0-9]+)*$` |
| `name` | LocalizedText | required |
| `description` | LocalizedText \| null | |
| `imageUrl` | string \| null | |
| `sortOrder` | integer | Ascending |
| `productCount` | integer | Public endpoints: published products; admin endpoints: all products |
| `createdAt`, `updatedAt` | datetime | |

### 2.3 Product (`Product`)

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `slug` | string | Unique, kebab-case; used in storefront URLs |
| `sku` | string | Unique, 1–40 chars |
| `title` | LocalizedText | |
| `shortDescription` | LocalizedText | Card/listing text |
| `description` | LocalizedText | Plain text; newlines are paragraphs |
| `category` | `{ id, slug, name }` | Resolved category reference |
| `materialType` | `"stone" \| "wood" \| "mixed"` | Filterable "product type" |
| `material` | LocalizedText | e.g. "White marble", "Walnut & travertine" |
| `finish` | LocalizedText \| null | e.g. "Polished" |
| `origin` | LocalizedText \| null | e.g. "Iran" |
| `dimensions` | `{ length, width, height, weight }` | cm / kg, each `number \| null` |
| `images` | ProductImage[] | Ordered by `sortOrder`; first = cover |
| `pricing` | Pricing | See below |
| `currency` | `"IRT"` | |
| `options` | ProductOption[] | Variants / configurable options |
| `specifications` | `{ label: LocalizedText, value: LocalizedText }[]` | Free-form spec table |
| `availability` | `"in_stock" \| "made_to_order" \| "out_of_stock" \| "discontinued"` | |
| `preOrder` | `{ enabled, minQuantity, maxQuantity, leadTimeDays }` | `leadTimeDays: integer \| null` |
| `isFeatured` | boolean | Shown on home page |
| `status` | `"draft" \| "published" \| "archived"` | Only `published` is public |
| `tags` | string[] | Search keywords |
| `createdAt`, `updatedAt` | datetime | |

`Pricing` (discriminated by `type`):
```json
{ "type": "fixed", "amount": 78000000 }
{ "type": "range", "min": 185000000, "max": 240000000 }
{ "type": "on_request" }
```

`ProductImage`: `{ "id", "url", "alt": LocalizedText, "sortOrder": integer }`

`ProductOption` (one value chosen per option):
```json
{
  "id": "opt_nature_size",
  "name": { "en": "Size", "fa": "اندازه" },
  "required": true,
  "values": [
    { "id": "val_nature_180", "label": { "en": "180 × 90 cm", "fa": "۱۸۰ × ۹۰ سانتی‌متر" }, "priceDelta": 0 },
    { "id": "val_nature_220", "label": { "en": "220 × 100 cm", "fa": "۲۲۰ × ۱۰۰ سانتی‌متر" }, "priceDelta": 25000000 }
  ]
}
```
`priceDelta` (integer Toman, may be negative) is added to every price component of the unit price.

**Derived rule — `canBePreOrdered`:** `status == "published" && preOrder.enabled && availability != "discontinued"`.

`ProductSummary` (list item) contains: `id, slug, sku, title, shortDescription, category, materialType, material, pricing, currency, availability, isFeatured, status, coverImage (ProductImage|null), preOrderEnabled (= canBePreOrdered), createdAt, updatedAt`.

### 2.4 Pre-order (`PreOrder`)

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `reference` | string | Human-friendly, unique: `PO-<year>-<5-digit sequence>` |
| `status` | `"pending" \| "confirmed" \| "rejected" \| "cancelled" \| "completed"` | |
| `customer` | CustomerSnapshot | Copy of the profile **at submission time** |
| `items` | PreOrderItem[] | |
| `estimatedTotal` | `{ min, max }` \| null | null if any item is `on_request` |
| `currency` | `"IRT"` | |
| `customerNote` | string \| null | ≤ 1000 chars |
| `adminNote` | string \| null | Internal; ≤ 2000 chars. **Omit or null it in customer endpoints** in the real backend if it must stay internal |
| `history` | `{ status, changedAt, changedBy: "customer"\|"admin"\|"system", note }[]` | Append-only |
| `createdAt`, `updatedAt` | datetime | |

`CustomerSnapshot`: `{ userId, email, firstName, lastName, phone, address }`.

`PreOrderItem`: `{ id, productId, productSlug, productTitle: LocalizedText, productImageUrl, quantity, selectedOptions: SelectedOption[], unitPrice: Pricing }` — product data is **snapshotted** so later product edits/deletion don't change existing pre-orders.

`SelectedOption`: `{ optionId, valueId, optionName: LocalizedText, valueLabel: LocalizedText, priceDelta }`.

**Status machine** (enforced server-side):

```
pending ──► confirmed ──► completed
   │            │
   ├──► rejected └──► cancelled
   └──► cancelled
```

| From | Allowed to |
|---|---|
| pending | confirmed, rejected, cancelled |
| confirmed | completed, cancelled |
| rejected / cancelled / completed | — (terminal) |

Customers can only cancel while `pending`. Every change appends to `history`.

**Price computation:** `unitPrice = product.pricing + Σ selectedOption.priceDelta` (floored at 0, per component);
`estimatedTotal = Σ unitPrice × quantity` (min/max separately; `fixed` counts as min = max).

### 2.5 Dashboard stats (`DashboardStats`)
```json
{
  "products": { "total": 16, "byStatus": { "draft": 1, "published": 15, "archived": 0 } },
  "categories": { "total": 5 },
  "preOrders": { "total": 3, "byStatus": { "pending": 1, "confirmed": 1, "rejected": 0, "cancelled": 0, "completed": 1 } },
  "customers": { "total": 1 },
  "recentPreOrders": [ /* PreOrder, max 5, newest first */ ]
}
```

---

## 3. Authentication & profile

### 3.1 `POST /auth/google` — Google sign-in / sign-up
**Auth:** Public

Exchanges a Google ID token (from Google Identity Services on the frontend) for an app session. Creates the user if the email is new (`role: customer`, `authProvider: google`, profile pre-filled from `given_name` / `family_name`, `avatarUrl` from `picture`). Existing accounts with the same email are signed in (account linking by verified email).

**Backend must:** verify the JWT signature with Google's JWKS, `aud == GOOGLE_CLIENT_ID`, `iss ∈ {accounts.google.com, https://accounts.google.com}`, `exp` in the future, and `email_verified == true`.

Request:
```json
{ "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..." }
```
Response `201 Created` (new user) or `200 OK` (existing user):
```json
{
  "data": {
    "accessToken": "eyJ...",
    "expiresAt": "2026-10-07T10:00:00.000Z",
    "user": { "id": "usr_x", "email": "nima@gmail.com", "role": "customer", "authProvider": "google",
              "avatarUrl": "https://lh3.googleusercontent.com/...", "profile": { "firstName": "Nima", "lastName": "" },
              "isProfileComplete": false, "createdAt": "...", "updatedAt": "..." }
  }
}
```
Errors: `422 VALIDATION_ERROR` (missing token), `401 INVALID_GOOGLE_TOKEN`.

> Mock mode uses unsigned tokens prefixed `mockgoogle.` — the real backend must reject them.

### 3.2 `POST /auth/register` — Email/password sign-up
**Auth:** Public

Request:
```json
{ "email": "someone@example.com", "password": "at-least-8-chars" }
```
Rules: valid email; password 8–128 chars.
Response `201`: `AuthSession` (profile `null`, `isProfileComplete: false`).
Errors: `422 VALIDATION_ERROR`, `409 EMAIL_TAKEN` (details field `email`).

### 3.3 `POST /auth/login` — Email/password sign-in (customers & admins)
**Auth:** Public

Request: `{ "email": "admin@senseofstone.com", "password": "..." }`
Response `200`: `AuthSession`.
Errors: `422 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS` (same error for unknown email and wrong password; also for Google-only accounts without a password). Should be rate-limited (`429`).

### 3.4 `POST /auth/logout`
**Auth:** Customer (token optional — always succeeds)

Invalidates the presented token. Response `204`.

### 3.5 `GET /auth/me` — Current user
**Auth:** Customer
Response `200`: `User`. Errors: `401 UNAUTHENTICATED`.

### 3.6 `PUT /me/profile` — Complete profile
**Auth:** Customer

Sets **all** required profile fields (the "complete your profile" step). Sets `isProfileComplete: true`.

Request:
```json
{
  "firstName": "Nima",
  "lastName": "Karimi",
  "phone": "09121112233",
  "address": { "city": "Tehran", "line": "Enghelab St. 10", "postalCode": "1234567890" }
}
```
Response `200`: updated `User`. Errors: `401`, `422 VALIDATION_ERROR` (see §2.1 rules; `details[].field` e.g. `address.line`).

### 3.7 `PATCH /me/profile` — Update profile
**Auth:** Customer

Partial update; any subset of the `PUT` body. `address` is merged field by field. `isProfileComplete` is recomputed.
Response `200`: `User`. Errors: `401`, `422`.

### 3.8 Profile picture (optional)
**Auth:** Customer

#### `POST /me/profile/avatar` — Set profile picture
`Content-Type: multipart/form-data`, field `file`. Allowed: `image/jpeg`, `image/png`, `image/webp`, `image/avif`; max 5 MB (see §6.4). Replaces any existing picture.
Response `200`: updated `User` (`avatarUrl` set to the new image's URL).
Errors: `401`, `413 PAYLOAD_TOO_LARGE`, `415 UNSUPPORTED_MEDIA_TYPE`, `422` (missing file).

#### `DELETE /me/profile/avatar` — Remove profile picture
Clears `avatarUrl` back to `null`. A profile picture is always optional — this never affects `isProfileComplete`.
Response `200`: updated `User`. Errors: `401`.

---

## 4. Catalog & contact (public)

Only `status = published` products are visible. Drafts/archived return `404`.

### 4.1 `GET /products` — List / search / filter products
**Auth:** Public

| Query param | Type | Description |
|---|---|---|
| `q` | string | Full-text search over title (all locales), short description, material, SKU, category name, tags. Case-insensitive, substring match (backend may use proper FTS) |
| `category` | string | Category **slug** |
| `materialType` | `stone\|wood\|mixed` | |
| `availability` | `in_stock\|made_to_order\|out_of_stock\|discontinued` | |
| `preOrderOnly` | `true` | Only products where `canBePreOrdered` |
| `featured` | `true` | Only `isFeatured` |
| `minPrice`, `maxPrice` | integer | Compared against the reference price (`fixed.amount` or `range.min`). `on_request` products are excluded when either bound is given |
| `sort` | `newest` (default) \| `featured` \| `price_asc` \| `price_desc` \| `title_asc` | `on_request` sorts last for price sorts; `title_asc` uses `Accept-Language` |
| `page`, `pageSize` | integer | Default `pageSize` 12 |

Unknown/invalid filter values are ignored.

Example: `GET /products?q=marble&category=tables&materialType=stone&sort=price_asc&page=1&pageSize=12`

Response `200`:
```json
{
  "data": [
    {
      "id": "prd_luna_coffee",
      "slug": "luna-coffee-table",
      "sku": "SOS-TB-002",
      "title": { "en": "Luna Coffee Table", "fa": "میز جلومبلی لونا" },
      "shortDescription": { "en": "Round white marble coffee table...", "fa": "..." },
      "category": { "id": "cat_tables", "slug": "tables", "name": { "en": "Tables", "fa": "میز" } },
      "materialType": "stone",
      "material": { "en": "White marble", "fa": "مرمر سفید" },
      "pricing": { "type": "fixed", "amount": 78000000 },
      "currency": "IRT",
      "availability": "in_stock",
      "isFeatured": true,
      "status": "published",
      "coverImage": { "id": "img_1", "url": "https://cdn.../luna-1.jpg", "alt": { "en": "Luna coffee table" }, "sortOrder": 0 },
      "preOrderEnabled": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": { "page": 1, "pageSize": 12, "total": 1, "totalPages": 1 }
}
```

### 4.2 `GET /products/slug/:slug` — Product by slug
**Auth:** Public. Response `200`: `Product`. Errors: `404 NOT_FOUND`.

### 4.3 `GET /products/:id` — Product by ID
**Auth:** Public. Response `200`: `Product`. Errors: `404`.

### 4.4 `GET /products/:id/options` — Product options/variants
**Auth:** Public. Response `200`: `ProductOption[]`. Errors: `404`.

### 4.5 `GET /products/:id/related` — Related products
**Auth:** Public. Query: `limit` (1–12, default 4).
Ranking suggestion: same category (+2), same `materialType` (+1); excludes the product itself.
Response `200`: `ProductSummary[]` (no `meta`). Errors: `404`.

### 4.6 `GET /categories` — List categories
**Auth:** Public. Sorted by `sortOrder`. Response `200`: `Category[]` (`productCount` = published products).

### 4.7 `GET /categories/slug/:slug`
**Auth:** Public. Response `200`: `Category`. Errors: `404`.

### 4.8 `POST /contact` — Contact message
**Auth:** Public (the "Contact us" page).

Request:
```json
{ "name": "Sara Ahmadi", "email": "sara@example.com", "message": "Do you make the Luna table in 180 cm?" }
```
Rules: `name` 2–80 chars, `email` valid address, `message` 10–2000 chars (all trimmed).

Server behaviour: store the message and notify the team (email/SMS). Rate-limit by IP.

Response `201`: `{ "data": { "id": "msg_x1", "createdAt": "..." } }`
Errors: `422 VALIDATION_ERROR` (`details[].field` = `name` / `email` / `message`), `429 RATE_LIMITED`.

---

## 5. Pre-orders (customer)

A pre-order is a **request**; there is no payment. All endpoints require authentication; customers only ever see their own pre-orders (others return `404`, never `403`).

### 5.1 `POST /pre-orders` — Create pre-order
**Auth:** Customer **with complete profile**

Request:
```json
{
  "items": [
    { "productId": "prd_nature_dining", "quantity": 2, "options": { "opt_nature_size": "val_nature_220" } }
  ],
  "customerNote": "Please call before delivery"
}
```
Rules:
* `items`: 1–20 lines. `quantity`: integer within the product's `preOrder.minQuantity..maxQuantity`.
* `options`: map of `optionId → valueId`. Every `required` option must be present; unknown option or value IDs are rejected.
* Product must satisfy `canBePreOrdered`.
* `customerNote`: optional, ≤ 1000 chars.

Server behaviour: snapshot customer profile and product data; compute `unitPrice` and `estimatedTotal` (§2.4); `status = pending`; `history = [{ status: "pending", changedBy: "customer" }]`; generate `reference`. Suggested side effects: notify admins (email/SMS), send confirmation to customer.

Response `201`: `PreOrder`
```json
{
  "data": {
    "id": "po_8f2k",
    "reference": "PO-2026-00004",
    "status": "pending",
    "customer": { "userId": "usr_customer", "email": "customer@example.com", "firstName": "Ali", "lastName": "Rezaei",
                  "phone": "09121234567", "address": { "city": "Tehran", "line": "Valiasr St., No. 12" } },
    "items": [
      {
        "id": "poi_1", "productId": "prd_nature_dining", "productSlug": "nature-dining-table",
        "productTitle": { "en": "Nature Dining Table", "fa": "میز ناهارخوری نیچر" },
        "productImageUrl": "https://cdn.../nature-1.jpg", "quantity": 2,
        "selectedOptions": [ { "optionId": "opt_nature_size", "valueId": "val_nature_220",
          "optionName": { "en": "Size" }, "valueLabel": { "en": "220 × 100 cm" }, "priceDelta": 25000000 } ],
        "unitPrice": { "type": "range", "min": 210000000, "max": 265000000 }
      }
    ],
    "estimatedTotal": { "min": 420000000, "max": 530000000 },
    "currency": "IRT",
    "customerNote": "Please call before delivery",
    "adminNote": null,
    "history": [ { "status": "pending", "changedAt": "...", "changedBy": "customer", "note": null } ],
    "createdAt": "...", "updatedAt": "..."
  }
}
```
Errors:
* `401 UNAUTHENTICATED`
* `403 PROFILE_INCOMPLETE` — frontend redirects to profile completion
* `422 PRODUCT_NOT_PREORDERABLE` — `details[0].field = "items.<i>.productId"`
* `422 VALIDATION_ERROR` — e.g. `items.0.quantity` (`out_of_range`), `items.0.options.<optionId>` (`required` / `invalid`)

### 5.2 `GET /pre-orders` — My pre-orders
**Auth:** Customer. Query: `status` (optional), `page`, `pageSize` (default 10). Newest first.
Response `200`: paginated `PreOrder[]`.

### 5.3 `GET /pre-orders/:id` — My pre-order details
**Auth:** Customer (owner). Response `200`: `PreOrder`. Errors: `401`, `404`.

### 5.4 `POST /pre-orders/:id/cancel` — Cancel my pre-order
**Auth:** Customer (owner). Only allowed while `pending`.
Request (optional body): `{ "reason": "Changed my mind" }` (≤ 500 chars; stored as the history note).
Response `200`: updated `PreOrder` (`status: cancelled`, history entry `changedBy: customer`).
Errors: `401`, `404`, `409 INVALID_STATUS_TRANSITION`.

---

## 6. Admin

All endpoints require **Admin** (`401` without token, `403 FORBIDDEN` for non-admins).
Admin authentication uses `/auth/login` (or `/auth/google` for admin Google accounts); the role comes from the user record. Admin accounts are provisioned by the backend (seed/CLI) — there is no public admin sign-up.

### 6.1 `GET /admin/me` — Admin user information
Response `200`: `User` with `role: "admin"`. Used by the dashboard to verify admin access.

### 6.2 `GET /admin/dashboard` — Overview stats
Response `200`: `DashboardStats` (§2.5).

### 6.3 Products

#### `GET /admin/products` — List products (any status)
Same query params as §4.1 plus `status` (`draft|published|archived`). Default `pageSize` 20.
Response `200`: paginated `ProductSummary[]`.

#### `GET /admin/products/:id` — View product (any status)
Response `200`: `Product`. Errors: `404`.

#### `POST /admin/products` — Create product
Request body — `ProductInput` (`src/domain/product.ts`):
```json
{
  "slug": "luna-coffee-table",
  "sku": "SOS-TB-002",
  "title": { "en": "Luna Coffee Table", "fa": "میز جلومبلی لونا" },
  "shortDescription": { "en": "Round white marble coffee table.", "fa": "میز جلومبلی گرد از مرمر سفید." },
  "description": { "en": "Luna is carved from...", "fa": "لونا از..." },
  "categoryId": "cat_tables",
  "materialType": "stone",
  "material": { "en": "White marble", "fa": "مرمر سفید" },
  "finish": { "en": "Polished", "fa": "براق" },
  "origin": null,
  "dimensions": { "length": 90, "width": 90, "height": 38, "weight": 95 },
  "images": [ { "url": "https://cdn.../upl_1.jpg", "alt": { "en": "Luna coffee table" }, "sortOrder": 0 } ],
  "pricing": { "type": "fixed", "amount": 78000000 },
  "options": [
    { "name": { "en": "Finish", "fa": "پرداخت" }, "required": true,
      "values": [ { "label": { "en": "Polished", "fa": "براق" }, "priceDelta": 0 } ] }
  ],
  "specifications": [ { "label": { "en": "Shape", "fa": "شکل" }, "value": { "en": "Round", "fa": "گرد" } } ],
  "availability": "in_stock",
  "preOrder": { "enabled": true, "minQuantity": 1, "maxQuantity": 10, "leadTimeDays": 30 },
  "isFeatured": true,
  "status": "draft",
  "tags": ["marble"]
}
```
Validation:
* `slug` kebab-case & unique (`409 SLUG_TAKEN`); `sku` 1–40 & unique (`409 CONFLICT`, field `sku`).
* All `LocalizedText` fields require non-empty `en`. `finish`/`origin` may be `null`.
* `categoryId` must exist (`422`, field `categoryId`).
* `pricing`: integers ≥ 0; for `range`, `max ≥ min`.
* `dimensions.*`: number ≥ 0 or null.
* `images`: ≤ 20; `url` must reference an uploaded file or allowed host.
* `options[].values`: ≥ 1 each; `priceDelta` integer.
* `preOrder`: `minQuantity ≥ 1`, `maxQuantity ≥ minQuantity`, `leadTimeDays` integer ≥ 0 or null.
* `tags`: ≤ 20 non-empty strings.

IDs inside `images`, `options` and `options[].values` are optional: omitted → created; present → kept (so existing pre-order snapshots and option IDs stay stable).

Response `201`: `Product`. Errors: `422`, `409`.

#### `PUT /admin/products/:id` — Update product
Full replacement with the same body and rules as create (uniqueness checks ignore the product itself).
Response `200`: `Product`. Errors: `404`, `409`, `422`.

#### `PATCH /admin/products/:id/status` — Change product status
Request: `{ "status": "published" }`. Response `200`: `Product`. Errors: `404`, `422`.

#### `PUT /admin/products/:id/options` — Replace product options/variants
Request: `{ "options": [ /* ProductInput.options */ ] }`. Response `200`: `ProductOption[]` (with IDs). Errors: `404`, `422`.

#### `DELETE /admin/products/:id` — Delete product
Response `204`. Existing pre-orders keep their snapshots. Recommended: soft-delete in the DB. Errors: `404`.

### 6.4 Images

#### `POST /admin/uploads` — Upload product/category image
`Content-Type: multipart/form-data`, field `file`. Allowed: `image/jpeg`, `image/png`, `image/webp`, `image/avif`; max 5 MB.
Response `201`:
```json
{ "data": { "id": "upl_7a", "url": "https://cdn.senseofstone.com/uploads/upl_7a.jpg", "contentType": "image/jpeg", "size": 184223 } }
```
The returned `url` is then placed into `ProductInput.images[].url` or `CategoryInput.imageUrl`.
Errors: `413 PAYLOAD_TOO_LARGE`, `415 UNSUPPORTED_MEDIA_TYPE`, `422` (missing file).
Backend note: store in object storage (S3-compatible), strip EXIF, optionally generate resized variants; add the CDN host to `NEXT_PUBLIC_IMAGE_HOSTS`.

(Mock mode serves uploads from `GET /uploads/:id`. The real backend may serve from a CDN instead; this route is not part of the contract.)

### 6.5 Categories

| Method & path | Purpose | Body | Success |
|---|---|---|---|
| `GET /admin/categories` | List all (with admin `productCount`) | — | `200 Category[]` |
| `POST /admin/categories` | Create | `CategoryInput` | `201 Category` |
| `PUT /admin/categories/:id` | Update (full) | `CategoryInput` | `200 Category` |
| `DELETE /admin/categories/:id` | Delete | — | `204` |

`CategoryInput`:
```json
{ "slug": "tables", "name": { "en": "Tables", "fa": "میز" }, "description": null, "imageUrl": null, "sortOrder": 1 }
```
Errors: `409 SLUG_TAKEN`, `409 CATEGORY_NOT_EMPTY` (delete while products reference it), `404`, `422`.

### 6.6 Pre-orders

#### `GET /admin/pre-orders` — List all pre-orders
| Query | Description |
|---|---|
| `status` | Filter by status |
| `q` | Search reference, customer email, first/last name, phone |
| `productId` | Only pre-orders containing this product |
| `page`, `pageSize` | Default `pageSize` 20 |

Newest first. Response `200`: paginated `PreOrder[]` (includes customer info and items).

#### `GET /admin/pre-orders/:id` — Pre-order details
Response `200`: `PreOrder`. Errors: `404`.

#### `PATCH /admin/pre-orders/:id/status` — Change status
Request:
```json
{ "status": "confirmed", "note": "Production scheduled for next week" }
```
Must follow the status machine (§2.4). Appends a history entry (`changedBy: "admin"`). Suggested side effect: notify the customer.
Response `200`: `PreOrder`. Errors: `404`, `409 INVALID_STATUS_TRANSITION`, `422`.

#### `PATCH /admin/pre-orders/:id` — Update internal note
Request: `{ "adminNote": "Customer prefers morning delivery" }` (or `null` to clear; ≤ 2000 chars).
Response `200`: `PreOrder`.

---

## 7. Endpoint summary

| Method | Path | Auth | Service method (`src/services`) |
|---|---|---|---|
| POST | `/auth/google` | Public | `auth.signInWithGoogle` |
| POST | `/auth/register` | Public | `auth.register` |
| POST | `/auth/login` | Public | `auth.login` |
| POST | `/auth/logout` | Customer | `auth.logout` |
| GET | `/auth/me` | Customer | `auth.me` |
| PUT | `/me/profile` | Customer | `profile.complete` |
| PATCH | `/me/profile` | Customer | `profile.update` |
| POST | `/me/profile/avatar` | Customer | `profile.uploadAvatar` |
| DELETE | `/me/profile/avatar` | Customer | `profile.removeAvatar` |
| GET | `/products` | Public | `catalog.listProducts` |
| GET | `/products/slug/:slug` | Public | `catalog.getProductBySlug` |
| GET | `/products/:id` | Public | `catalog.getProductById` |
| GET | `/products/:id/options` | Public | `catalog.getProductOptions` |
| GET | `/products/:id/related` | Public | `catalog.getRelatedProducts` |
| GET | `/categories` | Public | `catalog.listCategories` |
| GET | `/categories/slug/:slug` | Public | `catalog.getCategoryBySlug` |
| POST | `/contact` | Public | `contact.send` |
| POST | `/pre-orders` | Customer + complete profile | `preOrders.create` |
| GET | `/pre-orders` | Customer | `preOrders.listMine` |
| GET | `/pre-orders/:id` | Customer (owner) | `preOrders.getMine` |
| POST | `/pre-orders/:id/cancel` | Customer (owner) | `preOrders.cancel` |
| GET | `/admin/me` | Admin | `admin.me` |
| GET | `/admin/dashboard` | Admin | `admin.getDashboard` |
| GET | `/admin/products` | Admin | `admin.products.list` |
| POST | `/admin/products` | Admin | `admin.products.create` |
| GET | `/admin/products/:id` | Admin | `admin.products.get` |
| PUT | `/admin/products/:id` | Admin | `admin.products.update` |
| PATCH | `/admin/products/:id/status` | Admin | `admin.products.setStatus` |
| PUT | `/admin/products/:id/options` | Admin | `admin.products.replaceOptions` |
| DELETE | `/admin/products/:id` | Admin | `admin.products.remove` |
| POST | `/admin/uploads` | Admin | `admin.uploadImage` |
| GET | `/admin/categories` | Admin | `admin.categories.list` |
| POST | `/admin/categories` | Admin | `admin.categories.create` |
| PUT | `/admin/categories/:id` | Admin | `admin.categories.update` |
| DELETE | `/admin/categories/:id` | Admin | `admin.categories.remove` |
| GET | `/admin/pre-orders` | Admin | `admin.preOrders.list` |
| GET | `/admin/pre-orders/:id` | Admin | `admin.preOrders.get` |
| PATCH | `/admin/pre-orders/:id/status` | Admin | `admin.preOrders.updateStatus` |
| PATCH | `/admin/pre-orders/:id` | Admin | `admin.preOrders.updateNote` |

---

## 8. Implementation notes for the backend

1. **Contract tests.** `src/mocks/server/router.test.ts` exercises this contract through the frontend's own services. Point those tests at the real backend (swap `InProcessTransport` for `HttpTransport`) to verify compatibility.
2. **CORS.** Allow the frontend origin(s), methods `GET, POST, PUT, PATCH, DELETE`, headers `Authorization, Content-Type, Accept-Language`.
3. **Sessions.** Minimum: opaque or JWT access token (7 days) as above. Recommended hardening: short-lived access token + refresh token in an `httpOnly; Secure; SameSite=Lax` cookie with `POST /auth/refresh`; the frontend's `ApiClient.onUnauthenticated` hook is the place to add refresh-and-retry.
4. **Passwords.** Hash with argon2id or bcrypt. Rate-limit `/auth/login` and `/auth/register`.
5. **Google.** Verify ID tokens server-side (see §3.1). Link accounts by verified email.
6. **Transactions.** Creating a pre-order (reference sequence + snapshot) must be atomic. References must be unique.
7. **Authorization.** Customer endpoints must scope by `userId`; return `404` for other users' resources.
8. **Soft deletes** for products and categories are recommended; the API behaviour (404 after delete) stays the same.
9. **Notifications** (not part of this contract yet): email/SMS on pre-order creation and status changes, and on new contact messages (§4.8).
10. **Search.** Substring match is sufficient initially; PostgreSQL full-text search (with Persian normalisation of ی/ي and ک/ك) is recommended later.
