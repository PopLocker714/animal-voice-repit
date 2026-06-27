// Thin client for the Bun API. Same-origin in production; in dev Vite proxies
// /api to the API server (see vite.config.ts).
export interface PlayRow {
  id: number;
  name: string;
  animalId: string;
  percent: number;
  createdAt: number;
  audioUrl: string | null;
}

async function jsonOrThrow(res: Response) {
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/** Record one play (name + animal + score, optional audio). Returns its id. */
export const submitPlay = (args: {
  name: string;
  animalId: string;
  percent: number;
  blob: Blob | null;
}): Promise<{ id: number }> => {
  const fd = new FormData();
  fd.set("name", args.name);
  fd.set("animalId", args.animalId);
  fd.set("percent", String(args.percent));
  if (args.blob) fd.set("audio", args.blob, "attempt.webm");
  return fetch("/api/plays", { method: "POST", body: fd }).then(jsonOrThrow);
};

export const fetchPlays = (): Promise<PlayRow[]> =>
  fetch("/api/admin/plays").then(jsonOrThrow);

export const resetGame = (): Promise<{ ok: boolean }> =>
  fetch("/api/admin/reset", { method: "POST" }).then(jsonOrThrow);
