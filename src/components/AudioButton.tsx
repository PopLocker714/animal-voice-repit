import { useAudioPlayer } from "./useAudioPlayer";

interface Props {
  // Either a direct URL (server recording) or an async resolver (local blob).
  url?: string;
  resolve?: () => Promise<string | null>;
  label?: string; // shown when idle
  className?: string;
}

/**
 * Plays a recording on tap and reflects its state: ⏳ while loading,
 * ⏸ while playing (tap again to stop), and the label when idle.
 */
export function AudioButton({ url, resolve, label = "▶︎ Послушать", className }: Props) {
  const { state, toggle } = useAudioPlayer({ url, resolve });
  const content = state === "loading" ? "⏳" : state === "playing" ? "⏸" : label;
  const cls = `${className ?? "btn btn--ghost"}${state === "playing" ? " is-playing" : ""}`;
  return (
    <button className={cls} onClick={toggle} aria-busy={state === "loading"}>
      {content}
    </button>
  );
}
