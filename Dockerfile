# --- Build stage: compile the static PWA with Bun + Vite ---
FROM oven/bun:1-alpine AS build
WORKDIR /app

# Install deps first (cached unless manifests change)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build the app -> /app/dist (app shell + sounds + service worker)
COPY . .
RUN bun run build

# --- Serve stage: static files via nginx, no app server needed ---
FROM nginx:alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
