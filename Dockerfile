FROM node:22-bookworm-slim AS development

WORKDIR /app

ENV NODE_ENV=development \
    WRANGLER_WRITE_LOGS=false \
    WRANGLER_LOG_PATH=/app/.wrangler/logs \
    MINIFLARE_REGISTRY_PATH=/app/.wrangler/registry

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .

EXPOSE 3000

CMD ["npm", "run", "docker:dev"]

FROM node:22-bookworm-slim AS build

WORKDIR /app

ENV NODE_ENV=production \
    WRANGLER_WRITE_LOGS=false \
    WRANGLER_LOG_PATH=/app/.wrangler/logs \
    MINIFLARE_REGISTRY_PATH=/app/.wrangler/registry

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production \
    NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt \
    WRANGLER_WRITE_LOGS=false \
    WRANGLER_LOG_PATH=/app/.wrangler/logs \
    MINIFLARE_REGISTRY_PATH=/app/.wrangler/registry

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/wrangler.local.jsonc ./wrangler.local.jsonc

EXPOSE 3000

CMD ["npm", "run", "docker:start"]
