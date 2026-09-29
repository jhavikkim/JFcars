FROM node:22-bookworm-slim AS development

WORKDIR /app

ENV NODE_ENV=development \
    WRANGLER_WRITE_LOGS=false \
    WRANGLER_LOG_PATH=/app/.wrangler/logs \
    MINIFLARE_REGISTRY_PATH=/app/.wrangler/registry

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "docker:dev"]
