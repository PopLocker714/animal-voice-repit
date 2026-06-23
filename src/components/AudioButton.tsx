import { useRef, useState } from "react";

interface Props {
  // Either a direct URL (server recording) or an async resolver (local blob).
  url?: string;
  resolve?: () => Promise<string | null>;
  label?: string; // shown when idle
  className?: string;
}

type State = "idle" | "loading" | "playing";

/**
 * Plays a recording on tap and reflects its state: ⏳ while loading,
 * ⏸ while playing (tap again to stop), and the label when idle.
 */
export function AudioButton({ url, resolve, label = "▶︎ Послушать", className }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<State>("idle");

  async function ensureAudio(): Promise<HTMLAudioElement | null> {
    if (audioRef.current) return audioRef.current;
    let src = url ?? null;
    if (!src && resolve) {
      setState("loading");
      src = await resolve();
    }
    if (!src) {
      setState("idle");
      return null;
    }
    const a = new Audio(src);
    a.onwaiting = () => setState("loading");
    a.onplaying = () => setState("playing");
    a.onended = () => setState("idle");
    a.onpause = () => setState("idle");
    a.onerror = () => setState("idle");
    audioRef.current = a;
    return a;
  }

  async function onClick() {
    // Tap while playing → stop.
    if (audioRef.current && state === "playing") {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState("idle");
      return;
    }
    const a = await ensureAudio();
    if (!a) return;
    a.currentTime = 0;
    setState("loading");
    try {
      await a.play();
    } catch {
      setState("idle");
    }
  }

  const content = state === "loading" ? "⏳" : state === "playing" ? "⏸" : label;
  const cls = `${className ?? "btn btn--ghost"}${state === "playing" ? " is-playing" : ""}`;

  return (
    <button className={cls} onClick={onClick} aria-busy={state === "loading"}>
      {content}
    </button>
  );
}
