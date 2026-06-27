// Realtime plays table over WebSocket pub/sub. The API calls broadcastPlays()
// after any mutation; server.ts provides the actual publish function (Bun's
// server.publish) and subscribes sockets to TOPIC.
import { getPlays } from "./db";

export const TOPIC = "plays";

type Publisher = (topic: string, data: string) => void;
let publish: Publisher | null = null;

export function setPublisher(fn: Publisher): void {
  publish = fn;
}

/** The message a freshly-connected socket receives, and what we broadcast. */
export function playsMessage(): string {
  const rows = getPlays().map((r) => ({
    id: r.id,
    name: r.name,
    animalId: r.animal_id,
    percent: r.percent,
    createdAt: r.created_at,
    audioUrl: r.audio_mime ? `/api/recordings/${r.id}` : null,
  }));
  return JSON.stringify({ type: "plays", rows });
}

export function broadcastPlays(): void {
  publish?.(TOPIC, playsMessage());
}
