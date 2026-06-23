import { useRef, useState } from "react";

export type PlayerState = "idle" | "loading" | "playing";

interface Opts {
  url?: string;
  resolve?: () => Promise<string | null>;
}

/**
 * Play/stop a recording. Resolves a local blob URL lazily if needed and tracks
 * loading/playing state. Used both by AudioButton and by whole-row tap targets.
 */
export function useAudioPlayer(opts: Opts) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>("idle");

  async function toggle() {
    // Tap while playing → stop.
    if (audioRef.current && state === "playing") {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState("idle");
      return;
    }
    if (!audioRef.current) {
      let src = opts.url ?? null;
      if (!src && opts.resolve) {
        setState("loading");
        src = await opts.resolve();
      }
      if (!src) {
        setState("idle");
        return;
      }
      const a = new Audio(src);
      a.onwaiting = () => setState("loading");
      a.onplaying = () => setState("playing");
      a.onended = () => setState("idle");
      a.onpause = () => setState("idle");
      a.onerror = () => setState("idle");
      audioRef.current = a;
    }
    audioRef.current.currentTime = 0;
    setState("loading");
    try {
      await audioRef.current.play();
    } catch {
      setState("idle");
    }
  }

  return { state, toggle };
}
