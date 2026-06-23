// Realtime leaderboard over WebSocket pub/sub. The API calls
// broadcastLeaderboard() after any mutation; server.ts provides the actual
// publish function (Bun's server.publish) and subscribes sockets to TOPIC.
import { getLeaderboard } from "./db";

export const TOPIC = "leaderboard";

type Publisher = (topic: string, data: string) => void;
let publish: Publisher | null = null;

export function setPublisher(fn: Publisher): void {
  publish = fn;
}

/** The message a freshly-connected socket receives, and what we broadcast. */
export function leaderboardMessage(): string {
  return JSON.stringify({ type: "leaderboard", rows: getLeaderboard() });
}

export function broadcastLeaderboard(): void {
  publish?.(TOPIC, leaderboardMessage());
}
