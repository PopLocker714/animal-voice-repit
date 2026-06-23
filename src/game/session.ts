// Local game session: which player, the shuffled order of animals, how far
// they've got, and the per-round results. Persisted so a refresh resumes.
import { ANIMALS } from "../data/animals";

export type GameMode = "online" | "local";

// Where a round's recording lives: on the server, or in local IndexedDB.
export type AudioRef =
  | { kind: "server"; id: number }
  | { kind: "local"; key: string };

export interface RoundResult {
  animalId: string;
  percent: number;
  audio: AudioRef | null;
}
export interface GameSession {
  user: { id: number; name: string };
  mode: GameMode;
  order: string[]; // animal ids, shuffled
  index: number; // next round to play
  done: RoundResult[];
}

const KEY = "avg.session.v1";
const NAME_KEY = "avg.lastname";

/** Last name the player typed — prefilled on the welcome screen after a round. */
export const getLastName = (): string => {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
};
export const setLastName = (name: string): void => {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* ignore */
  }
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function newSession(
  user: { id: number; name: string },
  mode: GameMode
): GameSession {
  return { user, mode, order: shuffle(ANIMALS.map((a) => a.id)), index: 0, done: [] };
}

export function loadSession(): GameSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GameSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: GameSession): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
}
