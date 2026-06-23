import { useEffect, useRef, useState } from "react";
import { animalName, ANIMALS_BY_ID } from "../data/animals";
import { AnimalIcon } from "../components/AnimalIcon";
import { useI18n } from "../i18n";
import { MicRecorder } from "../audio/record";
import { playReference } from "../audio/reference";
import { scoreAttempt } from "../audio/scoreAttempt";
import { submitResult } from "../api";
import { saveRecording } from "../game/localStore";
import type { AudioRef, GameSession, RoundResult } from "../game/session";
import type { ScoreResult } from "../audio/score";

type Phase = "idle" | "recording" | "scoring" | "result";

interface Props {
  session: GameSession;
  onAdvance: (round: RoundResult) => void;
}

const micSupported = MicRecorder.isSupported();
// Below this score we offer a retry instead of moving on (e.g. silence/glitch).
const RETRY_THRESHOLD = 10;

export function Game({ session, onAdvance }: Props) {
  const { t, lang } = useI18n();
  const animalId = session.order[session.index];
  const animal = ANIMALS_BY_ID[animalId];
  const total = session.order.length;

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

  // New animal: reset and play its sound.
  useEffect(() => {
    setPhase("idle");
    setScore(null);
    setError(null);
    pendingBlob.current = null;
    playSound();
    return () => recorderRef.current?.cancel();
  }, [animalId]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // Score only here; the recording is saved later when the round is accepted
      // (so a retry doesn't create duplicate results).
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

  // Accept the current attempt: save the recording, then advance.
  async function accept() {
    if (!score) return;
    setSaving(true);
    let audio: AudioRef | null = null;
    const blob = pendingBlob.current;
    try {
      if (blob) {
        if (session.mode === "online") {
          const r = await submitResult({
            userId: session.user.id,
            animalId,
            percent: score.percent,
            blob,
          });
          audio = { kind: "server", id: r.id };
        } else {
          const key = await saveRecording(blob);
          audio = { kind: "local", key };
        }
      }
    } catch {
      // advance even if saving failed
    }
    setSaving(false);
    onAdvance({ animalId, percent: score.percent, audio });
  }

  return (
    <div className="challenge">
      <div className="progress">
        {t("game.progress", {
          n: session.index + 1,
          total,
          name: session.user.name,
        })}
      </div>
      <div className="progress-bar">
        <span style={{ width: `${(session.index / total) * 100}%` }} />
      </div>

      <div key={animalId} className="challenge__hero" style={{ background: animal.color }}>
        <AnimalIcon animal={animal} className="challenge__emoji" />
        <span className="challenge__name">{animalName(animal, lang)}</span>
      </div>

      <button className="btn btn--ghost" onClick={playSound} disabled={soundPlaying}>
        {t("game.listen_again")}
      </button>

      {phase === "idle" &&
        (soundPlaying ? (
          // Block recording until the animal's sound has finished playing.
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
              {saving
                ? t("common.dots")
                : session.index + 1 < total
                  ? t("game.next")
                  : t("game.finish")}
            </button>
          )}
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
