// Live leaderboard over WebSocket. The server pushes the full table on connect
// and after every change; this hook keeps it in React state and reconnects if
// the socket drops.
import { useEffect, useState } from "react";
import type { LeaderRow } from "./api";

function wsUrl(): string {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${location.host}/api/ws`;
}

export function useLeaderboard(): LeaderRow[] | null {
  const [rows, setRows] = useState<LeaderRow[] | null>(null);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let alive = true;

    function connect() {
      socket = new WebSocket(wsUrl());
      socket.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "leaderboard") setRows(msg.rows as LeaderRow[]);
        } catch {
          /* ignore malformed */
        }
      };
      socket.onclose = () => {
        if (alive) retry = setTimeout(connect, 1000); // reconnect
      };
      socket.onerror = () => socket?.close();
    }
    connect();

    return () => {
      alive = false;
      clearTimeout(retry);
      socket?.close();
    };
  }, []);

  return rows;
}
