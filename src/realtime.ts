// Live plays table over WebSocket. The server pushes the full table on connect
// and after every change; this hook keeps it in React state and reconnects if
// the socket drops.
import { useEffect, useState } from "react";
import type { PlayRow } from "./api";

function wsUrl(): string {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${location.host}/api/ws`;
}

export function usePlays(): PlayRow[] | null {
  const [rows, setRows] = useState<PlayRow[] | null>(null);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let alive = true;

    function connect() {
      socket = new WebSocket(wsUrl());
      socket.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "plays") setRows(msg.rows as PlayRow[]);
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
