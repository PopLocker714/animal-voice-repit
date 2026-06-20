// Minimal static file server for the built PWA, powered by Bun.
// Serves ./dist, falls back to index.html (SPA routes), sets cache headers.
// No dependencies — just the Bun runtime.
const DIST = new URL("./dist/", import.meta.url);
const PORT = Number(Bun.env.PORT ?? 3000);

function cacheControl(pathname: string): string {
  // Never hard-cache the entry doc, service worker or manifest, so updates
  // reach already-installed clients.
  if (
    pathname === "/index.html" ||
    pathname === "/sw.js" ||
    pathname === "/registerSW.js" ||
    pathname === "/manifest.webmanifest"
  ) {
    return "no-cache";
  }
  // Content-hashed build assets are immutable.
  if (pathname.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  return "public, max-age=86400";
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";

    // Resolve within dist and serve, with SPA fallback for unknown paths.
    let file = pathname.includes("..")
      ? Bun.file(new URL("./index.html", DIST))
      : Bun.file(new URL("." + pathname, DIST));

    if (!(await file.exists())) {
      pathname = "/index.html";
      file = Bun.file(new URL("./index.html", DIST));
    }

    const headers: Record<string, string> = { "Cache-Control": cacheControl(pathname) };
    // Bun doesn't auto-detect .webmanifest — set it explicitly.
    if (pathname.endsWith(".webmanifest")) headers["Content-Type"] = "application/manifest+json";

    return new Response(file, { headers });
  },
});

console.log(`Serving ./dist on http://0.0.0.0:${PORT}`);
