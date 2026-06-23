// Bun server: JSON/recording API + realtime leaderboard (WebSocket) + static
// PWA (./dist), SPA fallback. No dependencies beyond the Bun runtime.
import { handleApi } from "./server/api";
import { leaderboardMessage, setPublisher, TOPIC } from "./server/realtime";

const DIST = new URL("./dist/", import.meta.url);
const PORT = Number(Bun.env.PORT ?? 3000);

function cacheControl(pathname: string): string {
  if (
    pathname === "/index.html" ||
    pathname === "/sw.js" ||
    pathname === "/registerSW.js" ||
    pathname === "/manifest.webmanifest"
  ) {
    return "no-cache";
  }
  if (pathname.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  return "public, max-age=86400";
}

const server = Bun.serve({
  port: PORT,
  maxRequestBodySize: 32 * 1024 * 1024, // allow audio uploads
  async fetch(req, server) {
    // Realtime leaderboard socket.
    if (new URL(req.url).pathname === "/api/ws") {
      return server.upgrade(req)
        ? undefined
        : new Response("ws upgrade failed", { status: 400 });
    }

    // API next.
    const api = await handleApi(req);
    if (api) return api;

    // Static files from dist, with SPA fallback (covers /admin too).
    const url = new URL(req.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";

    let file = pathname.includes("..")
      ? Bun.file(new URL("./index.html", DIST))
      : Bun.file(new URL("." + pathname, DIST));

    if (!(await file.exists())) {
      pathname = "/index.html";
      file = Bun.file(new URL("./index.html", DIST));
    }

    const headers: Record<string, string> = { "Cache-Control": cacheControl(pathname) };
    if (pathname.endsWith(".webmanifest")) headers["Content-Type"] = "application/manifest+json";

    return new Response(file, { headers });
  },
  websocket: {
    open(ws) {
      ws.subscribe(TOPIC);
      ws.send(leaderboardMessage()); // send current state immediately
    },
    message() {
      // clients are receive-only
    },
    close(ws) {
      ws.unsubscribe(TOPIC);
    },
  },
});

// Let the API broadcast leaderboard changes through this server's pub/sub.
setPublisher((topic, data) => server.publish(topic, data));

console.log(`Serving API + WS + ./dist on http://0.0.0.0:${PORT}`);
