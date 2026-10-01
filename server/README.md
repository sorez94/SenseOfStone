# Sense Of Stone — Backend API

Production-ready backend for the **Sense Of Stone** product showcase / pre-order platform,
implementing the contract in [`../client/docs/API.md`](../client/docs/API.md) exactly (paths,
methods, request/response shapes, status/error codes). There is **no payment flow** — a
"pre-order" is a request with a status lifecycle (`pending → confirmed|rejected|cancelled →
completed|cancelled`).

## 1. Stack & architecture

| Concern | Choice | Why |
|---|---|---|
| Framework | **NestJS 11** (Express), TypeScript strict | Modular DI, guards/pipes/interceptors, and first-class Swagger generation map directly onto the Controller → Service → Repository layering this contract needs; plain Express would mean hand-rolling all of that. Pinned to the 11.x line rather than 12 because `@nestjs/common@12` shipped as **ESM-only** (`"type":"module"`), which breaks Jest's default CommonJS test runner — 11.x is the latest line that's still fully CJS-compatible. |
| Database | **PostgreSQL + Prisma** | Typed queries/migrations, first-class JSONB support for the bilingual (`en`/`fa`) `LocalizedText` fields, and a real SQL engine for the faceted product search/sort the contract requires. |
| Auth | Argon2id password hashing; JWT access token + rotated, hashed refresh token (reuse-detected); logout via a `jti` revocation table | See [§8 Auth design](#8-auth-design-why-access-tokens-are-long-lived) for why the access token is long-lived here, not 15 minutes. |
| Validation | `class-validator` / `class-transformer` DTOs mirroring the frontend mock's exact zod rules | One global `ValidationPipe` + a custom `exceptionFactory` produce the contract's `422 VALIDATION_ERROR` envelope with `details[]`. |
| Object storage | S3-compatible client (`@aws-sdk/client-s3`) — MinIO locally, swap env vars for Cloudflare R2/AWS S3 in production | `multer` memory storage + magic-byte sniffing (`file-type`) + `sharp` re-encode (strips EXIF, normalizes format) before upload. |
| Errors | Single `AllExceptionsFilter` (global) | Maps every thrown error — ours, Nest's built-ins, Multer, unexpected — to the 18 `{error:{code,message,details}}` codes in API.md §1.6. |
| Rate limiting | `@nestjs/throttler`, global default + a stricter limit on `/auth/login`, `/auth/register`, `/contact` | |
| Logging | `nestjs-pino` (structured JSON in prod, pretty in dev), redacts `Authorization`/`Cookie` | |
| Docs | Swagger/OpenAPI at `/docs` | |

**Layering:** every feature module is `Controller → Service → Repository`. Repositories are the
only place that touches Prisma; services hold business rules (price computation, status
machine, profile-completeness, option validation); controllers only wire HTTP ↔ service and
never contain business logic or DB calls. DTOs (class-validator) are always distinct from
Prisma entities — no entity (and never a password hash) is ever returned directly.

## 2. Folder structure

```
src/
  main.ts                 bootstrap (helmet, cors, cookies, global ValidationPipe, Swagger)
  app.module.ts            wires every module + the global filter/interceptor/throttler guard
  config/                  typed, validated env config (fails fast on a bad .env)
  common/                  cross-module infra: error envelope, guards, decorators, mappers, utils
  prisma/                  PrismaService (injectable PrismaClient)
  modules/
    auth/                  register/login/google/refresh/logout/me
    profile/               PUT/PATCH /me/profile
    categories/            public + admin controllers sharing one service/repository
    products/              public + admin controllers; raw-SQL faceted search (see §7)
    uploads/                admin image upload → S3-compatible storage
    pre-orders/             customer + admin controllers; price computation, status machine
    contact/                POST /contact
    admin/                  /admin/me, /admin/dashboard
prisma/
  schema.prisma            data model (see §3)
  migrations/              hand-reviewed SQL (incl. the pre-order reference sequence)
  seed.ts                  admin + demo customer, 5 categories, 16 products, 3 pre-orders
test/                      e2e (supertest, full Nest app + real Postgres)
```

## 3. Data model (ERD in short)

```
User 1─* RefreshToken          User 1─* PreOrder
Category 1─* Product           Product 1─* ProductImage
Product 1─* ProductOption 1─* ProductOptionValue
RevokedAccessToken (jti blocklist, for logout)
ContactMessage
```

Notable choices (full detail in `prisma/schema.prisma`):
- **Soft deletes**: `Category.deletedAt` / `Product.deletedAt` — a deleted row still exists so
  old pre-orders' snapshots never break; all queries filter `deletedAt: null` and a 404 looks
  identical to "never existed" either way.
- **Bilingual fields** (`title`, `name`, `material`, …) are `JSONB` holding `{en, fa?}` —
  matches `LocalizedText` exactly and needs no schema change to add a third locale later.
- **Price filtering/sorting** uses a maintained `referencePrice` column (`fixed→amount`,
  `range→min`, `on_request→NULL`) so `minPrice`/`maxPrice`/`price_asc`/`price_desc` can be
  plain indexed SQL instead of computing it per-row at query time.
- **`PreOrder.items` / `.customerSnapshot` / `.history` are JSONB**, not relational tables —
  the contract's defining rule for pre-orders is that they **snapshot** product/customer data
  at submission time, so there's nothing to normalize; a JSONB blob *is* the snapshot.
- **`pre_order_reference_seq`** is a real Postgres `SEQUENCE` (not an app-level counter) so
  `PO-<year>-<5-digit-seq>` generation is atomic under concurrent writes with zero extra
  locking; see the migration SQL for the exact DDL.
- Unique/indexed as required: `User.email`, `Category.slug`, `Product.slug`, `Product.sku`,
  `PreOrder.reference`; indexes on `categoryId`, `status`, `userId`, `deletedAt`, etc.

## 4. Setup

### Prerequisites
Node.js 22 LTS, npm, a PostgreSQL 14+ instance, and (for uploads) an S3-compatible endpoint —
or just use Docker Compose for all of that (§6).

### Install & configure
```bash
cd server
npm install
cp .env.example .env     # edit DATABASE_URL etc. if not using the defaults below
npx prisma generate      # safe to re-run any time; required once after every `npm install`
                          # (this environment disables npm install-scripts by policy, so
                          #  Prisma's normal postinstall-generate step doesn't fire automatically)
```

### Run migrations & seed
```bash
npm run prisma:migrate:deploy   # applies prisma/migrations/ (use :dev instead while iterating locally)
npm run seed                    # admin + demo customer + 5 categories + 16 products + 3 pre-orders
```
Seed credentials (overridable via `SEED_*` env vars):
| Role | Email | Password |
|---|---|---|
| Admin | `admin@senseofstone.com` | `admin1234` |
| Customer | `customer@example.com` | `customer1234` |

### Run the API
```bash
npm run start:dev     # ts-node-dev, hot reload, http://localhost:4000
# or
npm run build && npm start   # compiled, production mode
```
Swagger UI: `http://localhost:4000/docs`. All API routes are under the `/v1` prefix (e.g.
`http://localhost:4000/v1/products`), per `API_PREFIX` in `.env`.

## 5. Environment variables

All variables are listed with defaults/examples in [`.env.example`](.env.example) and are
**validated at startup** (`src/config/env.validation.ts`) — a missing/malformed value fails
fast with a clear error instead of misbehaving at runtime. Groups:

- **App**: `PORT`, `API_PREFIX`, `CORS_ORIGINS` (comma-separated, must match the frontend's
  exact origin).
- **Database**: `DATABASE_URL`.
- **JWT**: `JWT_ACCESS_SECRET`/`JWT_ACCESS_TTL`, `JWT_REFRESH_SECRET`/`JWT_REFRESH_TTL`,
  `REFRESH_COOKIE_NAME`, `COOKIE_DOMAIN`, `COOKIE_SECURE` — see §8.
- **Google**: `GOOGLE_CLIENT_ID` (same value as the frontend's `NEXT_PUBLIC_GOOGLE_CLIENT_ID`).
- **Object storage**: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`,
  `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`, `S3_PUBLIC_BASE_URL`, `UPLOAD_MAX_SIZE_MB`.
- **Rate limiting**: `THROTTLE_TTL_SECONDS`, `THROTTLE_LIMIT` (global default; auth/contact
  endpoints use a stricter hardcoded 5-req/60s via `@Throttle()`).
- **Logging**: `LOG_LEVEL`.
- **Seed**: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_CUSTOMER_EMAIL`,
  `SEED_CUSTOMER_PASSWORD`.

## 6. Docker

### Local development
Postgres + MinIO + the backend (hot-reloaded), run from the **repo root** (the directory
containing both `client/` and `server/`):
```bash
cp server/.env.example server/.env
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed
```
The frontend is normally run separately on the host (`cd client && npm run dev`) for fast
HMR, pointing `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/v1`.

### Production (frontend + backend + Postgres + MinIO together)
See **"Deploy to a fresh Linux server"** below — `docker-compose.prod.yml` at the repo root
builds and runs all four together.

## 7. Business-logic notes worth knowing before you read the code

- **Product search/sort/filter** (`GET /products`, `GET /admin/products`) is backed by a
  hand-written parameterized raw SQL query (`ProductsRepository.search`), not Prisma's query
  builder — Prisma can't express "case-insensitive substring match across several JSONB
  `en`/`fa` text fields plus a locale-aware title sort" without raw SQL, and this is exactly
  the kind of query Postgres is good at. All interpolated values go through `Prisma.sql`
  parameter binding (never string-concatenated), so this is not SQL-injectable.
- **Deliberate deviation from the frontend's mock**: §4.1 of API.md says `q` search includes
  product `tags`; the actual mock implementation doesn't search tags. This backend follows the
  **written contract** (searches tags too), since the doc — not an incidental mock bug — is the
  stated source of truth.
- **Pre-order creation is one atomic transaction**: the Postgres sequence `nextval()` and the
  `PreOrder` row insert happen in a single `prisma.$transaction`, so a reference number is
  never issued without a corresponding row (`PreOrdersRepository.create`).
- **Price computation**: `unitPrice = product.pricing + Σ selectedOption.priceDelta`, each
  component (not the sum) floored at 0; `estimatedTotal` is `null` the moment any line item's
  resolved price is `on_request` (`pre-order-pricing.util.ts` — has its own unit tests).
- **Status machine** (`pending → confirmed|rejected|cancelled`, `confirmed →
  completed|cancelled`, everything else terminal) is enforced centrally in
  `pre-order.enums.ts#canTransition`, used by both the customer cancel endpoint and the admin
  status-change endpoint — there's exactly one place this rule lives.
- **`adminNote` is nulled out** on every customer-facing pre-order response (`toPreOrderDto`'s
  second argument), even though it's stored on the same row as the customer-visible fields.
- **History append is read-modify-write, not row-locked** (`appendHistoryAndSetStatus`): fine
  at this app's scale — the status-machine check still prevents an invalid double-transition;
  the only narrow risk under truly concurrent admin edits is a lost `history` entry, not a
  wrong final `status`. Documented in code rather than solved with `SELECT … FOR UPDATE` to
  keep the hot path simple.

## 8. Auth design: why access tokens are long-lived

The task brief asked for short-lived JWT access tokens + refresh rotation. That's implemented
in full (`TokenService`: hashed, rotated, reuse-detected refresh tokens; a `jti` blocklist so
logout actually revokes the presented access token). **However**, API.md §1.7/§8 documents the
contract's actual expectation as a single ~7-day access token, and the shipped frontend
(`ARCHITECTURE.md` §5) has **no refresh-and-retry wired into its HTTP client yet** — it just
redirects to `/login` on any `401`. Shipping a 15-minute access token against that frontend
would silently log users out every 15 minutes with no way to recover.

So: `JWT_ACCESS_TTL` defaults to `7d` (matching the contract), and refresh-token rotation is
fully implemented but exposed as an **additive** `POST /auth/refresh` endpoint the current
frontend doesn't call yet — exactly the hook `ARCHITECTURE.md` names as "the place to add
refresh-and-retry" when the frontend is ready to adopt it. Shortening `JWT_ACCESS_TTL` later is
a one-line env change, not a code change.

## 9. Tests

```bash
npm test              # unit tests (Jest) — pure logic + AuthService, no DB required
npm run test:e2e       # e2e (supertest) — needs a real, migrated Postgres (see below)
```

Unit tests cover the highest-risk pure logic: price computation (`unitPriceWithOptions`,
`estimateTotal`), the pre-order status machine, the `User` → API `profile`/`isProfileComplete`
mapping, and `AuthService` (register/login, including the "same `INVALID_CREDENTIALS` for an
unknown email, wrong password, or a Google-only account" rule).

e2e tests boot the **real** `AppModule` (global filter/interceptor included, since those are
DI providers) against a real database and drive it over HTTP with `supertest`:
- `test/auth.e2e-spec.ts` — register → duplicate-register conflict → login → wrong-password →
  `/auth/me` → logout → revoked-token rejection.
- `test/pre-orders.e2e-spec.ts` — seeds a product directly via Prisma, then: incomplete-profile
  rejection → non-preorderable-product rejection → out-of-range quantity → successful creation
  (asserts the snapshotted price and the `PO-YYYY-NNNNN` reference format) → list → **404 (not
  403) for another customer's pre-order** → cancel → re-cancel conflict.

Before running `test:e2e`, point `DATABASE_URL` at a real, migrated Postgres (a disposable one
is fine — the suite creates and cleans up its own rows):
```bash
npm run prisma:migrate:deploy
npm run test:e2e
```

## 10. Example requests

```bash
BASE=http://localhost:4000/v1

# Register
curl -s -X POST $BASE/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"jane@example.com","password":"supersecret123"}'

# Login (admin, from the seed data)
curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@senseofstone.com","password":"admin1234"}'
# => { "data": { "accessToken": "...", "expiresAt": "...", "user": { ... } } }

TOKEN=<accessToken from above>

# Browse products
curl -s "$BASE/products?category=tables&sort=price_asc&page=1&pageSize=12"

# Complete profile (required before creating a pre-order)
curl -s -X PUT $BASE/me/profile -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"firstName":"Jane","lastName":"Doe","phone":"09121234567","address":{"city":"Tehran","line":"Valiasr St., No. 12"}}'

# Create a pre-order
curl -s -X POST $BASE/pre-orders -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"<id from /products>","quantity":1}],"customerNote":"Please call first"}'

# Admin: dashboard stats
curl -s $BASE/admin/dashboard -H "Authorization: Bearer $TOKEN"

# Admin: upload a product image
curl -s -X POST $BASE/admin/uploads -H "Authorization: Bearer $TOKEN" -F file=@./photo.jpg
```

## 11. Deploy to a fresh Linux server

Everything below is run from the **repo root** (the directory containing `client/`, `server/`,
`docker-compose.prod.yml`, `.env.production.example`, and `deploy/`).

1. **One-time, on the target server**: install Docker Engine + the Compose plugin
   ([docs](https://docs.docker.com/engine/install/)), and add your deploy user to the `docker`
   group.
2. **One-time, locally**:
   ```bash
   cp .env.production.example .env          # fill in real secrets + your server's IP/domain
   cp deploy/.env.deploy.example deploy/.env.deploy   # REMOTE_HOST, REMOTE_USER, REMOTE_DIR
   ```
3. **Every deploy**:
   ```bash
   ./deploy/deploy.sh
   ```
   This rsyncs the repo (excluding `node_modules`/`.git`/build output) to the server and runs
   `docker compose -f docker-compose.prod.yml up -d --build` there. The backend container's
   entrypoint always applies pending migrations on boot; set `RUN_SEED=true` in `.env` for
   exactly the first deploy to populate demo data, then set it back to `false`.
4. Frontend ends up on port `80`, the API on port `4000`, MinIO's object storage on `9000`
   (must stay public — that's where uploaded image URLs resolve).

This ships **plain HTTP** by design (no Nginx/Certbot/TLS automation) — add a reverse proxy
(Nginx, Caddy) or put the server behind Cloudflare once you have a domain; nothing above needs
to change for that, it's purely what sits in front of ports 80/4000/9000.

### Assumptions & deliberate simplifications (flagged, not hidden)
- Product image `url`s are validated as well-formed absolute URLs, not checked against a host
  allowlist (API.md's "must reference an uploaded file or allowed host") — the only way to set
  one is via the admin-only `ProductInput.images[].url`, so the risk is an admin pointing at an
  arbitrary external image, not a public attack surface.
- `PATCH /admin/pre-orders/:id`'s `adminNote` is treated as optional+nullable rather than
  "key must always be present" (a quirk of the frontend mock's zod schema, not stated in
  API.md's prose).
- Read-modify-write for pre-order `history` appends (§7) — no row locking.
