import { useEffect, useRef, useState } from "react";
import { animalName, ANIMALS_BY_ID } from "../data/animals";
import { AnimalIcon } from "../components/AnimalIcon";
import { Confetti } from "../components/Confetti";
import { useI18n } from "../i18n";
import { MicRecorder } from "../audio/record";
import { playReference } from "../audio/reference";
import { scoreAttempt } from "../audio/scoreAttempt";
import { submitPlay } from "../api";
import type { ScoreResult } from "../audio/score";

type Phase = "idle" | "recording" | "scoring" | "result";

interface Props {
  playerName: string;
  animalId: string;
  // Called once the play has been recorded to the server (or best-effort failed).
  onDone: () => void;
}

const micSupported = MicRecorder.isSupported();
// Below this score we offer a retry instead of recording it (e.g. silence/glitch).
const RETRY_THRESHOLD = 10;

export function Play({ playerName, animalId, onDone }: Props) {
  const { t, lang } = useI18n();
  const animal = ANIMALS_BY_ID[animalId];

  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const recorderRef = useRef<MicRecorder | null>(null);
  const pendingBlob = useRef<Blob | null>(null);

  // Play the reference sound; recording stays blocked until it finishes.
  function playSound() {
    setSoundPlaying(true);
    playReference(animal.sound)
      .catch(() => {})
      .finally(() => setSoundPlaying(false));
  }

  // Reveal the animal and play its sound once on mount.
  useEffect(() => {
    playSound();
    return () => recorderRef.current?.cancel();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function startRecording() {
    setError(null);
    if (!micSupported) {
      setError(t("game.err_mic_unsupported"));
      return;
    }
    try {
      const rec = new MicRecorder();
      recorderRef.current = rec;
      await rec.start();
      setPhase("recording");
    } catch {
      setError(t("game.err_mic_denied"));
      setPhase("idle");
    }
  }

  async function stopRecording() {
    const rec = recorderRef.current;
    if (!rec) return;
    setPhase("scoring");
    try {
      const { buffer, blob } = await rec.stop();
      const scored = await scoreAttempt(animal.sound, buffer);
      pendingBlob.current = blob;
      setScore(scored);
      setPhase("result");
    } catch (e) {
      console.error(e);
      setError(t("game.err_record"));
      setPhase("idle");
    }
  }

  // Re-record the same animal (used when the score is too low / silence).
  function retry() {
    pendingBlob.current = null;
    setScore(null);
    setPhase("idle");
    playSound();
  }

  // Accept the attempt: record it on the server, then hand back to the board.
  async function accept() {
    if (!score) return;
    setSaving(true);
    try {
      await submitPlay({
        name: playerName,
        animalId,
        percent: score.percent,
        blob: pendingBlob.current,
      });
    } catch {
      // best-effort: still finish the turn even if saving failed
    }
    setSaving(false);
    onDone();
  }

  return (
    <div className="challenge">
      <div className="progress">{playerName}</div>

      <div key={animalId} className="challenge__hero" style={{ background: animal.color }}>
        <AnimalIcon animal={animal} className="challenge__emoji" />
        <span className="challenge__name">{animalName(animal, lang)}</span>
      </div>

      <button className="btn btn--ghost" onClick={playSound} disabled={soundPlaying}>
        {t("game.listen_again")}
      </button>

      {phase === "idle" &&
        (soundPlaying ? (
          <button className="btn btn--primary" disabled>
            {t("game.listening")}
          </button>
        ) : (
          <button className="btn btn--primary" onClick={startRecording}>
            {t("game.repeat")}
          </button>
        ))}
      {phase === "recording" && (
        <button className="btn btn--recording" onClick={stopRecording}>
          {t("game.stop")}
        </button>
      )}
      {phase === "scoring" && <p className="status">{t("game.scoring")}</p>}
      {phase === "result" && score && (
        <div className="result">
          {score.percent >= 75 && <Confetti />}
          <div className="result__percent">{score.percent}%</div>
          <div className="result__label">{t(score.verdict)}</div>
          {score.percent < RETRY_THRESHOLD ? (
            <>
              <p className="retry-hint">{t("game.retry_hint")}</p>
              <button className="btn btn--primary" onClick={retry} disabled={saving}>
                {t("game.retry")}
              </button>
              <button className="link" onClick={accept} disabled={saving}>
                {saving ? t("common.dots") : t("game.skip")}
              </button>
            </>
          ) : (
            <button className="btn btn--primary" onClick={accept} disabled={saving}>
              {saving ? t("common.dots") : t("game.done")}
            </button>
          )}
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
