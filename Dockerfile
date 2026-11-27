# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV HUSKY=0
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/pnpm/store pnpm install --frozen-lockfile --store-dir=/pnpm/store

FROM dependencies AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN mkdir -p public \
    && DATABASE_URL=/tmp/portals-build.db \
       BETTER_AUTH_URL=http://localhost:3000 \
       BETTER_AUTH_SECRET="$(node -p 'require("node:crypto").randomBytes(32).toString("hex")')" pnpm build

FROM node:24-bookworm-slim AS app
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL=/app/data/portals.db

RUN mkdir -p /app/data && chown node:node /app/data
COPY --chown=node:node drizzle ./drizzle

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3000
CMD ["node", "server.js"]
