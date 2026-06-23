# syntax=docker/dockerfile:1
# --- Build stage: compile the static PWA with Bun + Vite ---
FROM oven/bun:1-alpine AS build
WORKDIR /app
ENV BUN_INSTALL_CACHE_DIR=/root/.bun/install/cache

# Install deps first (own layer). BuildKit cache mount keeps Bun's package
# cache across builds, so installs are near-instant after the first one.
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Build the app -> /app/dist. vite only — type-checking is a dev/CI concern.
COPY . .
RUN bun run build:docker

# --- Serve stage: Bun serves the API + static dist (no nginx, no node_modules) ---
FROM oven/bun:1-alpine AS serve
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server.ts ./
COPY server ./server
ENV PORT=3000
ENV DATA_DIR=/app/data
VOLUME /app/data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:3000/ >/dev/null 2>&1 || exit 1
CMD ["bun", "server.ts"]
