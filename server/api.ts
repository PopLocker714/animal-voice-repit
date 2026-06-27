// JSON/multipart API for the game. Returns a Response for /api/* routes, or
// null if the path isn't an API route (so the caller can fall back to static).
import { addPlay, getPlay, getPlays, RECORDINGS_DIR, resetAll } from "./db";
import { broadcastPlays } from "./realtime";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const recordingPath = (id: number) => `${RECORDINGS_DIR}/${id}`;

const serialize = (r: {
  id: number;
  name: string;
  animal_id: string;
  percent: number;
  audio_mime: string | null;
  created_at: number;
}) => ({
  id: r.id,
  name: r.name,
  animalId: r.animal_id,
  percent: r.percent,
  createdAt: r.created_at,
  audioUrl: r.audio_mime ? `/api/recordings/${r.id}` : null,
});

export async function handleApi(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;
  if (!path.startsWith("/api/")) return null;

  try {
    // --- Record one play (multipart: name, animalId, percent, audio) ---
    if (path === "/api/plays" && req.method === "POST") {
      const form = await req.formData();
      const name = String(form.get("name") ?? "").trim();
      const animalId = String(form.get("animalId") ?? "");
      const percent = Math.round(Number(form.get("percent")));
      const audio = form.get("audio");
      if (!name || !animalId || Number.isNaN(percent)) {
        return json({ error: "name, animalId, percent required" }, 400);
      }
      const mime = audio instanceof Blob && audio.size > 0 ? audio.type || "audio/webm" : null;
      const id = addPlay(name, animalId, percent, mime);
      if (audio instanceof Blob && audio.size > 0) {
        await Bun.write(recordingPath(id), audio);
      }
      broadcastPlays(); // new row appears live in the admin table
      return json({ id });
    }

    // --- Admin: the full plays table (newest first) ---
    if (path === "/api/admin/plays" && req.method === "GET") {
      return json(getPlays().map(serialize));
    }

    // --- Admin: wipe everything ---
    if (path === "/api/admin/reset" && req.method === "POST") {
      resetAll();
      broadcastPlays(); // table is now empty everywhere
      return json({ ok: true });
    }

    // --- Stream a recording ---
    const m = path.match(/^\/api\/recordings\/(\d+)$/);
    if (m && (req.method === "GET" || req.method === "HEAD")) {
      const id = Number(m[1]);
      const play = getPlay(id);
      const file = Bun.file(recordingPath(id));
      if (!play || !(await file.exists())) return json({ error: "not found" }, 404);
      return new Response(file, {
        headers: {
          "Content-Type": play.audio_mime || "audio/webm",
          "Cache-Control": "no-cache",
        },
      });
    }

    return json({ error: "unknown endpoint" }, 404);
  } catch (err) {
    console.error("API error:", err);
    return json({ error: "server error" }, 500);
  }
}
