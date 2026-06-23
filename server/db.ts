// SQLite storage (Bun native `bun:sqlite`). Holds players and their per-animal
// results; the recorded audio itself lives as files under DATA_DIR/recordings.
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";

export const DATA_DIR = Bun.env.DATA_DIR ?? "./data";
export const RECORDINGS_DIR = `${DATA_DIR}/recordings`;

mkdirSync(RECORDINGS_DIR, { recursive: true });

export const db = new Database(`${DATA_DIR}/app.db`);
db.exec("PRAGMA journal_mode = WAL;");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS results (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    animal_id  TEXT NOT NULL,
    percent    INTEGER NOT NULL,
    audio_mime TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_results_user ON results(user_id);
`);

export interface UserRow {
  id: number;
  name: string;
  created_at: number;
}
export interface ResultRow {
  id: number;
  user_id: number;
  animal_id: string;
  percent: number;
  audio_mime: string | null;
  created_at: number;
}

const q = {
  createUser: db.query<UserRow, [string, number]>(
    "INSERT INTO users (name, created_at) VALUES (?, ?) RETURNING *"
  ),
  insertResult: db.query<{ id: number }, [number, string, number, string | null, number]>(
    "INSERT INTO results (user_id, animal_id, percent, audio_mime, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id"
  ),
  resultsForUser: db.query<ResultRow, [number]>(
    "SELECT * FROM results WHERE user_id = ? ORDER BY created_at ASC"
  ),
  resultById: db.query<ResultRow, [number]>("SELECT * FROM results WHERE id = ?"),
  userById: db.query<UserRow, [number]>("SELECT * FROM users WHERE id = ?"),
  allNames: db.query<{ name: string }, []>("SELECT name FROM users"),
  // Best result per animal: the top scorer for each animal (ties → earliest).
  bestByAnimal: db.query<
    {
      animal_id: string;
      user_id: number;
      name: string;
      percent: number;
      result_id: number;
      audio_mime: string | null;
    },
    []
  >(`
    SELECT animal_id, user_id, name, percent, result_id, audio_mime FROM (
      SELECT r.animal_id, r.user_id, u.name, r.percent,
             r.id AS result_id, r.audio_mime,
             ROW_NUMBER() OVER (
               PARTITION BY r.animal_id
               ORDER BY r.percent DESC, r.created_at ASC
             ) AS rn
      FROM results r JOIN users u ON u.id = r.user_id
    ) WHERE rn = 1
  `),
  // Leaderboard: highest total percent first.
  leaderboard: db.query<
    { id: number; name: string; created_at: number; total: number; count: number; avg: number },
    []
  >(`
    SELECT u.id, u.name, u.created_at,
           COALESCE(SUM(r.percent), 0)  AS total,
           COUNT(r.id)                  AS count,
           COALESCE(ROUND(AVG(r.percent)), 0) AS avg
    FROM users u
    LEFT JOIN results r ON r.user_id = u.id
    GROUP BY u.id
    ORDER BY total DESC, u.created_at ASC
  `),
};

/** Case-insensitive name check (JS lowercasing handles Cyrillic; SQLite's
 *  NOCASE/LOWER only fold ASCII). */
export function nameTaken(name: string): boolean {
  const target = name.trim().toLowerCase();
  return q.allNames.all().some((r) => r.name.trim().toLowerCase() === target);
}

export function createUser(name: string): UserRow {
  return q.createUser.get(name.slice(0, 40), Date.now())!;
}
export function addResult(
  userId: number,
  animalId: string,
  percent: number,
  audioMime: string | null
): number {
  return q.insertResult.get(userId, animalId, percent, audioMime, Date.now())!.id;
}
export const getResultsForUser = (userId: number) => q.resultsForUser.all(userId);
export const getResult = (id: number) => q.resultById.get(id);
export const getUser = (id: number) => q.userById.get(id);
export const getLeaderboard = () => q.leaderboard.all();
export const getBestByAnimal = () => q.bestByAnimal.all();

/** Wipe everything — players, results, and recording files. */
export function resetAll(): void {
  db.exec("DELETE FROM results; DELETE FROM users;");
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','results');");
  // Recreate an empty recordings dir.
  Bun.spawnSync(["rm", "-rf", RECORDINGS_DIR]);
  mkdirSync(RECORDINGS_DIR, { recursive: true });
}
