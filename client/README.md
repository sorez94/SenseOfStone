# Sense Of Stone — new-sos

Showcase and **pre-order** platform for natural stone and solid wood products (English + Persian).
No online payment: customers submit pre-order requests, and admins confirm them.

* Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
* Backend API contract: [`docs/API.md`](docs/API.md)

## Getting started

```bash
npm install
cp .env.example .env.local     # defaults to the built-in mock backend
npm run dev                    # http://localhost:3000 → redirects to /en
```

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `tsc --noEmit` (run `npx next typegen` first on a fresh clone) |
| `npm run lint` | ESLint |
| `npm test` | Vitest (domain rules + API contract against the mock backend) |

## Demo accounts (mock mode only)

| Role | Email | Password |
|---|---|---|
| Customer | customer@example.com | customer1234 |
| Admin | admin@senseofstone.com | admin1234 |

"Continue with Google" opens a mock account chooser unless `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set.
New accounts must complete their profile (name, phone, address) before pre-ordering.

## Connecting the real backend

```env
NEXT_PUBLIC_API_MODE=http
NEXT_PUBLIC_API_BASE_URL=https://api.example.com/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google web client id>
NEXT_PUBLIC_IMAGE_HOSTS=cdn.example.com
```

No UI or service code changes are needed if the backend follows `docs/API.md`.
Mock data is in memory and resets when the server restarts.
