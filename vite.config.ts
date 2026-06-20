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
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
});
