# syntax=docker/dockerfile:1

# ---- Base: shared OS deps (Prisma's query engine needs openssl on Alpine) ----
FROM node:22-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app

# ---- deps: full dependency install (incl. devDependencies) for building ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: compile TypeScript (app + seed script) ----
FROM deps AS build
COPY . .
RUN npx prisma generate
RUN npm run build && npm run build:seed

# ---- prod-deps: production-only node_modules (smaller final image) ----
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate

# ---- runtime: final slim image ----
FROM base AS runtime
ARG GIT_SHA=unknown
ENV NODE_ENV=production
ENV GIT_SHA=$GIT_SHA
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./
COPY docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh \
  && addgroup -S app && adduser -S app -G app \
  && chown -R app:app /app
USER app

EXPOSE 4000
ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["node", "dist/main.js"]
