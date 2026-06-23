// JSON/multipart API for the game. Returns a Response for /api/* routes, or
// null if the path isn't an API route (so the caller can fall back to static).
import {
  addResult,
  createUser,
  nameTaken,
  getBestByAnimal,
  getLeaderboard,
  getResult,
  getResultsForUser,
  getUser,
  RECORDINGS_DIR,
  resetAll,
} from "./db";
import { broadcastLeaderboard } from "./realtime";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const recordingPath = (id: number) => `${RECORDINGS_DIR}/${id}`;

export async function handleApi(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;
  if (!path.startsWith("/api/")) return null;

  try {
    // --- Create a player ---
    if (path === "/api/users" && req.method === "POST") {
      const body = (await req.json()) as { name?: string };
      const name = (body.name ?? "").trim();
      if (!name) return json({ error: "name required" }, 400);
      if (nameTaken(name)) return json({ error: "name_taken" }, 409);
      const user = createUser(name);
      broadcastLeaderboard(); // new player appears in the table
      return json(user);
    }

    // --- Live name-availability check (as the player types) ---
    if (path === "/api/users/check" && req.method === "GET") {
      const name = (url.searchParams.get("name") ?? "").trim();
      return json({ taken: name ? nameTaken(name) : false });
    }

    // --- Submit a result (multipart: userId, animalId, percent, audio) ---
    if (path === "/api/results" && req.method === "POST") {
      const form = await req.formData();
      const userId = Number(form.get("userId"));
      const animalId = String(form.get("animalId") ?? "");
      const percent = Math.round(Number(form.get("percent")));
      const audio = form.get("audio");
      if (!userId || !animalId || Number.isNaN(percent)) {
        return json({ error: "userId, animalId, percent required" }, 400);
      }
      const mime = audio instanceof Blob && audio.size > 0 ? audio.type || "audio/webm" : null;
      const id = addResult(userId, animalId, percent, mime);
      if (audio instanceof Blob && audio.size > 0) {
        await Bun.write(recordingPath(id), audio);
      }
      broadcastLeaderboard(); // this player's score just went up — push live
      return json({ id });
    }

    // --- A player's own results ---
    let m = path.match(/^\/api\/users\/(\d+)\/results$/);
    if (m && req.method === "GET") {
      const user = getUser(Number(m[1]));
      if (!user) return json({ error: "not found" }, 404);
      return json({ user, results: getResultsForUser(user.id).map(serializeResult) });
    }

    // --- Admin: leaderboard ---
    if (path === "/api/admin/users" && req.method === "GET") {
      return json(getLeaderboard());
    }

    // --- Admin: best scorer per animal ---
    if (path === "/api/admin/best-by-animal" && req.method === "GET") {
      return json(
        getBestByAnimal().map((r) => ({
          animalId: r.animal_id,
          userId: r.user_id,
          name: r.name,
          percent: r.percent,
          audioUrl: r.audio_mime ? `/api/recordings/${r.result_id}` : null,
        }))
      );
    }

    // --- Admin: one player's detail ---
    m = path.match(/^\/api\/admin\/users\/(\d+)$/);
    if (m && req.method === "GET") {
      const user = getUser(Number(m[1]));
      if (!user) return json({ error: "not found" }, 404);
      return json({ user, results: getResultsForUser(user.id).map(serializeResult) });
    }

    // --- Admin: reset everything ---
    if (path === "/api/admin/reset" && req.method === "POST") {
      resetAll();
      broadcastLeaderboard(); // table is now empty everywhere
      return json({ ok: true });
    }

    // --- Stream a recording ---
    m = path.match(/^\/api\/recordings\/(\d+)$/);
    if (m && (req.method === "GET" || req.method === "HEAD")) {
      const result = getResult(Number(m[1]));
      const file = Bun.file(recordingPath(Number(m[1])));
      if (!result || !(await file.exists())) return json({ error: "not found" }, 404);
      return new Response(file, {
        headers: {
          "Content-Type": result.audio_mime || "audio/webm",
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

function serializeResult(r: {
  id: number;
  animal_id: string;
  percent: number;
  audio_mime: string | null;
  created_at: number;
}) {
  return {
    id: r.id,
    animalId: r.animal_id,
    percent: r.percent,
    createdAt: r.created_at,
    audioUrl: r.audio_mime ? `/api/recordings/${r.id}` : null,
  };
}
