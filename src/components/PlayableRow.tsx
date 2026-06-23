import type { ReactNode } from "react";
import { useAudioPlayer } from "./useAudioPlayer";

interface Props {
  icon: ReactNode;
  name: string;
  percent: number;
  // Audio source for this row; null = no recording (row not clickable).
  audio: { url?: string; resolve?: () => Promise<string | null> } | null;
}

/** A result row where tapping ANYWHERE on the row plays the recording. */
export function PlayableRow({ icon, name, percent, audio }: Props) {
  const { state, toggle } = useAudioPlayer(audio ?? {});
  const glyph = state === "loading" ? "⏳" : state === "playing" ? "⏸" : "▶︎";
  return (
    <li
      className={`result-row${audio ? " result-row--click" : ""}`}
      onClick={audio ? toggle : undefined}
    >
      {icon}
      <span className="result-row__name">{name}</span>
      <span className="result-row__pct">{percent}%</span>
      {audio ? (
        <span
          className={`btn-mini${state === "playing" ? " is-playing" : ""}`}
          aria-busy={state === "loading"}
        >
          {glyph}
        </span>
      ) : (
        <span className="btn-mini btn-mini--off">—</span>
      )}
    </li>
  );
}
