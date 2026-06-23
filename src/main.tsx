import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import { I18nProvider } from "./i18n";
import "./styles.css";

// Auto-update the PWA: with registerType "autoUpdate" + skipWaiting/clientsClaim,
// a new service worker takes control immediately; registerSW reloads the page so
// users always get the latest version without clearing the cache. Also poll for
// updates hourly for long-lived sessions.
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);
    }
  },
});
void updateSW;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>
);
