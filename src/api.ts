// Thin client for the Bun API. Same-origin in production; in dev Vite proxies
// /api to the API server (see vite.config.ts).
export interface Player {
  id: number;
  name: string;
  created_at: number;
}
export interface ApiResult {
  id: number;
  animalId: string;
  percent: number;
  createdAt: number;
  audioUrl: string | null;
}
export interface LeaderRow {
  id: number;
  name: string;
  created_at: number;
  total: number;
  count: number;
  avg: number;
}

async function jsonOrThrow(res: Response) {
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export class NameTakenError extends Error {}

/** Live check whether an online name is already taken. */
export const checkName = (name: string): Promise<boolean> =>
  fetch(`/api/users/check?name=${encodeURIComponent(name)}`)
    .then(jsonOrThrow)
    .then((d: { taken: boolean }) => d.taken);

export const createUser = async (name: string): Promise<Player> => {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (res.status === 409) throw new NameTakenError("name_taken");
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
};

export const submitResult = (args: {
  userId: number;
  animalId: string;
  percent: number;
  blob: Blob | null;
}): Promise<{ id: number }> => {
  const fd = new FormData();
  fd.set("userId", String(args.userId));
  fd.set("animalId", args.animalId);
  fd.set("percent", String(args.percent));
  if (args.blob) fd.set("audio", args.blob, "attempt.webm");
  return fetch("/api/results", { method: "POST", body: fd }).then(jsonOrThrow);
};

export const fetchLeaderboard = (): Promise<LeaderRow[]> =>
  fetch("/api/admin/users").then(jsonOrThrow);

export interface AnimalBest {
  animalId: string;
  userId: number;
  name: string;
  percent: number;
  audioUrl: string | null;
}
export const fetchBestByAnimal = (): Promise<AnimalBest[]> =>
  fetch("/api/admin/best-by-animal").then(jsonOrThrow);

export const fetchUserDetail = (
  id: number
): Promise<{ user: Player; results: ApiResult[] }> =>
  fetch(`/api/admin/users/${id}`).then(jsonOrThrow);

export const resetGame = (): Promise<{ ok: boolean }> =>
  fetch("/api/admin/reset", { method: "POST" }).then(jsonOrThrow);
