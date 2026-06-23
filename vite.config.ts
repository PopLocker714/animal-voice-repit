import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// host: true lets a phone on the same Wi-Fi reach the dev server.
// NOTE: the microphone needs a secure context — works on localhost, but for
// LAN/phone testing serve over https (see README) or deploy behind TLS.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // new versions activate automatically
      injectRegister: false, // we register manually in main.tsx for auto-reload
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Повтори за животным",
        short_name: "Животные",
        description:
          "Выбери животное, послушай звук и повтори — узнай, насколько похоже.",
        lang: "ru",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#faf5ff",
        theme_color: "#7c3aed",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Precache the whole app shell AND every animal sound, so once installed
        // the game runs fully offline with no server.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,mp3,woff2,webmanifest}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        // The new SW takes control immediately instead of waiting for every tab
        // to close — this is what fixes the "stale cache" problem.
        clientsClaim: true,
        skipWaiting: true,
        // Never let the service worker handle the API (results, recordings, WS).
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    // In dev, the API runs separately (bun server.ts). Proxy /api to it —
    // ws:true so the realtime leaderboard socket (/api/ws) tunnels too.
    // API_PORT lets dev pick a free port (default 3000).
    proxy: {
      "/api": {
        target: `http://localhost:${(globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.API_PORT ?? 3000}`,
        ws: true,
      },
    },
  },
  build: {
    // Lighter build for slow / low-memory servers:
    minify: "esbuild", // fast, low-memory minifier (no terser)
    reportCompressedSize: false, // skip per-chunk gzip-size calc (notable CPU save)
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
});
