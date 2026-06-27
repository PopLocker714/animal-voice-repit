// SQLite storage (Bun native `bun:sqlite`). One flat table: each row is a single
// "play" — a child's name, the animal they got, and how well they imitated it.
// Names may repeat (hundreds of kids); there is no per-user account. The recorded
// audio itself lives as files under DATA_DIR/recordings/<id>.
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";

export const DATA_DIR = Bun.env.DATA_DIR ?? "./data";
export const RECORDINGS_DIR = `${DATA_DIR}/recordings`;

mkdirSync(RECORDINGS_DIR, { recursive: true });

export const db = new Database(`${DATA_DIR}/app.db`);
db.exec("PRAGMA journal_mode = WAL;");
db.exec(`
  CREATE TABLE IF NOT EXISTS plays (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    animal_id  TEXT NOT NULL,
    percent    INTEGER NOT NULL,
    audio_mime TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_plays_created ON plays(created_at);
`);

export interface PlayRow {
  id: number;
  name: string;
  animal_id: string;
  percent: number;
  audio_mime: string | null;
  created_at: number;
}

const q = {
  insertPlay: db.query<{ id: number }, [string, string, number, string | null, number]>(
    "INSERT INTO plays (name, animal_id, percent, audio_mime, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id"
  ),
  // Newest play first — that's how the live table reads top-to-bottom.
  allPlays: db.query<PlayRow, []>("SELECT * FROM plays ORDER BY created_at DESC, id DESC"),
  playById: db.query<PlayRow, [number]>("SELECT * FROM plays WHERE id = ?"),
};

export function addPlay(
  name: string,
  animalId: string,
  percent: number,
  audioMime: string | null
): number {
  return q.insertPlay.get(name.trim().slice(0, 40), animalId, percent, audioMime, Date.now())!.id;
}

export const getPlays = () => q.allPlays.all();
export const getPlay = (id: number) => q.playById.get(id);

/** Wipe everything — every play and every recording file. */
export function resetAll(): void {
  db.exec("DELETE FROM plays;");
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'plays';");
  // Recreate an empty recordings dir.
  Bun.spawnSync(["rm", "-rf", RECORDINGS_DIR]);
  mkdirSync(RECORDINGS_DIR, { recursive: true });
}
