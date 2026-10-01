# Plain (non-standalone) Next.js production image. The client doesn't set
# `output: "standalone"` in next.config.ts, so this ships full node_modules rather than
# a pruned bundle - simplest option without touching the existing frontend's config.
# (Optimization note for later: adding `output: "standalone"` there and switching this
# Dockerfile to copy only `.next/standalone` would shrink the final image substantially.)

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .

# NEXT_PUBLIC_* variables are inlined into the client bundle at BUILD time, so they must
# be passed as build args (docker build --build-arg ...), not just left as runtime env vars.
ARG NEXT_PUBLIC_API_MODE=http
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_IMAGE_HOSTS
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_MODE=$NEXT_PUBLIC_API_MODE \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NEXT_PUBLIC_IMAGE_HOSTS=$NEXT_PUBLIC_IMAGE_HOSTS \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 3000
CMD ["npm", "start"]
