# new-sos — Architecture

Product showcase and **pre-order** platform for stone and wooden products.
Visual design and UX follow the existing **SOS** project; the architecture is new.

## 1. Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, `proxy.ts`), React 19, TypeScript (strict, `noUncheckedIndexedAccess`) |
| Styling | Tailwind CSS 4 (CSS-first tokens in `src/app/globals.css`), logical properties for RTL |
| i18n | next-intl 4, locale-prefixed routes (`/en`, `/fa`), type-checked message keys |
| Server state | TanStack Query (client), Server Components (public catalog) |
| Forms | react-hook-form + zod 4 (localized messages) |
| Tests | Vitest (domain rules, URL parsing, form mapping, API contract, translation parity) |

## 2. Layering

```
UI (app routes, feature components)
      │  uses hooks / server helpers only
      ▼
services/        typed API clients, one per bounded context (auth, profile, catalog, preOrders, admin)
      │  depend only on ApiClient
      ▼
lib/api/ApiClient   envelope parsing, errors (ApiError), auth header, Accept-Language
      │  depends on an ApiTransport
      ▼
Transport ── HttpTransport (fetch)  ──►  real backend  (NEXT_PUBLIC_API_MODE=http)
          └─ HttpTransport → /api/v1  ─┐
          └─ InProcessTransport ───────┴► mocks/ fake backend implementing docs/API.md (mock mode)
```

* **domain/** — framework-free types and business rules shared by UI and the fake backend
  (status machine, option resolution, price estimation, profile completeness).
* The UI never imports mock data. Mocks are reachable **only** through the API contract.
* Switching to the real backend = environment change; services and UI stay untouched.
  `src/mocks/server/router.test.ts` doubles as a contract test suite to run against the real backend.

## 3. Folder structure

```
docs/            API.md (backend contract), ARCHITECTURE.md
messages/        en.json, fa.json (en.json is the key schema)
src/
  app/
    [locale]/
      (storefront)/          public site + account (SOS header/footer)
        page.tsx               home
        products/              listing, [slug] detail, [slug]/pre-order
        login, register, complete-profile
        account/               profile, pre-orders, pre-orders/[id]
      admin/                 admin shell (sidebar) — dashboard, products, categories, pre-orders
      [...rest]/, not-found  localized 404
    api/v1/[...path]/        fake backend HTTP entry (mock mode only)
  components/ui/         design-system primitives (Button, FormField, Dialog, DataTable, Pagination…)
  components/layout/     SiteHeader, SiteFooter, LocaleSwitcher, RouteError
  config/                env, site constants
  domain/                entities + pure business rules
  features/
    auth/                session provider, guards, redirects, Google adapters, forms
    catalog/             product card/grid/filters/gallery/specs, URL query parsing, server loaders
    home/                landing sections
    pre-orders/          pre-order form/flow, customer list/detail, hooks
    admin/               admin shell, hooks, product form model, views per area
  hooks/                 cross-feature hooks (formatters, localize, API errors, URL state)
  i18n/                  locale config, routing, navigation, request config, server formatters
  lib/api/               ApiClient, transports, errors, token storage, server/browser factories
  mocks/                 fake backend: in-memory DB + seed, router, handlers, validation
  providers/             AppProviders (QueryClient, services, session, toasts)
  proxy.ts               locale handling + optimistic auth redirect
```

Feature folders don't import each other's internals except through clear UI seams
(e.g. admin reuses catalog's `ProductSpecifications`, pre-orders' status badge).

## 4. Routes

| Route | Access | Rendering |
|---|---|---|
| `/{locale}` | public | Server |
| `/{locale}/products?q&category&materialType&availability&preOrderOnly&featured&minPrice&maxPrice&sort&page` | public | Server (URL-driven filters, works without JS) |
| `/{locale}/products/{slug}` | public | Server |
| `/{locale}/products/{slug}/pre-order` | public page, gated inline | Server + client flow |
| `/{locale}/login`, `/register` | guests | Client forms |
| `/{locale}/complete-profile` | signed in | Client |
| `/{locale}/account`, `/account/pre-orders`, `/account/pre-orders/{id}` | signed in | Client |
| `/{locale}/admin`, `/admin/products[/new|/{id}|/{id}/edit]`, `/admin/categories`, `/admin/pre-orders[/{id}]` | admin | Client |

## 5. Authentication flow

1. Login/Register pages offer **Continue with Google** and email/password.
   * Google adapter: `RealGoogleButton` (Google Identity Services) when `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
     is set, otherwise `MockGoogleButton` (fake account chooser producing a mock ID token).
   * Both send the ID token to `POST /auth/google`; the backend creates or signs in the user.
2. The session (`accessToken`, `expiresAt`) is stored in the `sos_at` cookie; the user comes from `GET /auth/me`.
3. `resolvePostAuthPath`: incomplete profile → `/complete-profile?next=…`; otherwise `next` (validated, same-site only) or `/` (`/admin` for admins).
4. Guards:
   * `proxy.ts` — optimistic redirect to `/login?next=…` for `/account`, `/admin`, `/complete-profile` when no cookie.
   * `<RequireAuth requireAdmin? requireCompleteProfile?>` — verifies the session via the API.
   * The backend is the real authority (401/403/`PROFILE_INCOMPLETE`).
5. Logout calls `POST /auth/logout`, clears the cookie and all cached private queries.

**Session storage.** The cookie is set by the frontend and is not `httpOnly`, so the Bearer token can be read by JS.
Recommended hardening once the backend exists: the backend sets an `httpOnly; Secure; SameSite=Lax` cookie
(same-site API domain) and the client uses `credentials: "include"`. Only `token-storage.ts` and `HttpTransport` change.

## 6. Pre-order flow

Product page CTA → `/products/{slug}/pre-order`:
1. Guest → inline "Sign in / Create account" card (links carry `next`).
2. Incomplete profile → inline "Complete profile" card.
3. Form: options (radio chips, required pre-selected), quantity stepper (product min/max), note, live price estimate (`unitPriceWithOptions` + `estimateTotal` from `domain/`), contact details preview.
4. `POST /pre-orders` → confirmation with reference (e.g. `PO-2026-00004`) → link to the pre-order detail page.
5. Status machine: `pending → confirmed|rejected|cancelled`, `confirmed → completed|cancelled`. Customers can cancel only while pending.

No payment is involved anywhere.

## 7. Localization

* `src/i18n/config.ts` is the single list of locales with direction and Intl locale. Adding a language means adding it there plus a `messages/<locale>.json`.
* `<html lang dir>` is set per locale; layouts use logical utilities (`ms-`, `pe-`, `start-`, `text-start`), and directional icons use `rtl:rotate-180`.
* Content is `LocalizedText` (`{ en, fa? }`) with fallback to English (`localize()`).
* Numbers, prices and dates use `Intl` (`fa-IR` gives Persian digits and the Solar Hijri calendar).
* Message keys are type-checked (`src/i18n/app-config.d.ts`); `messages.test.ts` enforces key and placeholder parity.
* Validation messages come from zod schema factories that receive the `validation` translator.
* Persian and Arabic digits in phone and postal code inputs are normalized.
* The next-intl request config is aliased directly in `next.config.ts` instead of using `createNextIntlPlugin()`. The plugin eagerly loads `@swc/core` (used only by its optional message extractor), and that package's native binding refuses to load when drive roots grant broad write access (`ERR_SWC_NATIVE_CACHE`). The alias is exactly what the plugin configures.

## 8. Design system (from SOS)

| SOS element | new-sos |
|---|---|
| Sage `#CAD7B2` footer and buttons, `#BBC3AB` dividers | `--color-sage`, `--color-sage-line`; `Button variant="primary"` turns leaf-green with white text on hover |
| Large uppercase sage titles ("PATTERNS", "COLLECTIONS") | `SectionTitle` (darkened `sage-deep` for WCAG AA large-text contrast) |
| Frosted glass fixed header, centred underlined nav | `SiteHeader` (sticky, backdrop-blur, `aria-current` underline) |
| Underline inputs, uppercase tracked labels, ruled "LOGIN" heading | `Input` (underline), `FormField` (caps labels), `RuledHeading` |
| Rounded shadowed product cards with hover scale | `ProductCard` |
| "Shop Now" link with growing underline and sliding arrow | `ShopNowLink` |
| Blurred category tiles that sharpen on hover | `CategoryShowcase` (CSS scroll-snap instead of a JS carousel) |
| Alternating image/text landing rows | `FeaturedRows` |
| Three-column sage footer and copyright | `SiteFooter` (stacks on mobile instead of shrinking text to 8px) |
| Glacier (EN) and Yekan (FA) fonts | `next/font/local` variables |

Deliberate deviations: the admin area (not present in SOS), accessible contrast for headings, readable mobile footer, and no JS carousels.

## 9. Decisions and assumptions

* **Currency:** integer Toman (`IRT`); prices can be fixed, a range, or "on request".
* **Variants** are modelled as independent options with price deltas (e.g. Size × Finish), not SKU combinations.
* **Snapshots:** pre-orders copy customer and product data so later edits or deletions don't change history.
* **Admins** are users with `role: "admin"`; there is no separate admin auth system and no public admin signup.
* **Mock data** lives in memory in the Next.js server process and resets on restart. Uploaded images are served from `/api/v1/uploads/:id` in mock mode.
* **Accessibility:** skip link; labelled controls with `aria-invalid`/`aria-describedby`; native `<dialog>` modals; keyboard gallery (arrow keys, mirrored in RTL); `prefers-reduced-motion` support; visible focus rings.

## 10. Remaining backend work

See `docs/API.md` §8. In short: implement the endpoints, verify Google ID tokens, hash passwords, set up persistent storage and object storage for uploads, add notifications (email/SMS) on pre-order events, optionally add refresh tokens and httpOnly cookies, and add rate limiting.
