// The shared card board lives on the host device (the phone running the game).
// Each animal is a card; once a child gets an animal it's "claimed" and shown
// open until every card is used, at which point the board resets for a new round.
// Persisted in localStorage so a refresh keeps the round going.
import { ANIMALS } from "../data/animals";

const KEY = "avg.board.v1";
const TOTAL = ANIMALS.length;

/** Animal ids already claimed in the current round. */
export function loadBoard(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    // Drop anything no longer a real animal (roster could change between builds).
    return ids.filter((id) => ANIMALS.some((a) => a.id === id));
  } catch {
    return [];
  }
}

function save(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

/**
 * Claim an animal for the round. Returns the new claimed list. When the last
 * card is taken the board auto-resets to empty so the next child starts fresh.
 */
export function claimAnimal(id: string): string[] {
  const cur = loadBoard();
  if (cur.includes(id)) return cur;
  const next = [...cur, id];
  const result = next.length >= TOTAL ? [] : next; // round complete → reset
  save(result);
  return result;
}

export function resetBoard(): void {
  save([]);
}
