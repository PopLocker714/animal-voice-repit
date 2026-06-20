import { useEffect, useRef, useState } from "react";
import type { Animal } from "../data/animals";
import { MicRecorder } from "../audio/record";
import { playReference, referenceMfcc } from "../audio/reference";
import { audioBufferToMfcc } from "../audio/features";
import { dtwDistance } from "../audio/dtw";
import { distanceToScore, type ScoreResult } from "../audio/score";

type Phase = "idle" | "recording" | "scoring" | "result";

interface Props {
  animal: Animal;
  onBack: () => void;
}

const micSupported = MicRecorder.isSupported();

export function Challenge({ animal, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MicRecorder | null>(null);

  // Reset whenever the animal changes; play its sound on entry.
  useEffect(() => {
    setPhase("idle");
    setResult(null);
    setError(null);
    playReference(animal.sound).catch(() => {
      /* sound file may not be added yet — ignore */
    });
    return () => recorderRef.current?.cancel();
  }, [animal]);

  async function handleRecord() {
    setError(null);
    if (!micSupported) {
      setError("Микрофон недоступен. Нужен https или localhost.");
      return;
    }
    try {
      const recorder = new MicRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setPhase("recording");
    } catch {
      setError("Не удалось получить доступ к микрофону.");
      setPhase("idle");
    }
  }

  async function handleStop() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    setPhase("scoring");
    try {
      const buffer = await recorder.stop();
      const [userMfcc, refMfcc] = await Promise.all([
        audioBufferToMfcc(buffer),
        referenceMfcc(animal.sound),
      ]);
      const distance = dtwDistance(refMfcc, userMfcc);
      const scored = distanceToScore(distance);
      // Raw distance is logged so the sigmoid in score.ts can be calibrated.
      console.log(`[${animal.id}] DTW distance=${distance.toFixed(2)} -> ${scored.percent}%`);
      setResult(scored);
      setPhase("result");
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error && e.message.includes("Sound not found")
          ? "Звук этого животного ещё не добавлен."
          : "Не получилось сравнить запись."
      );
      setPhase("idle");
    }
  }

  function tryAgain() {
    setResult(null);
    setPhase("idle");
    playReference(animal.sound).catch(() => {});
  }

  return (
    <div className="challenge">
      <button className="link" onClick={onBack}>
        ← Все животные
      </button>

      <div className="challenge__hero" style={{ background: animal.color }}>
        <span className="challenge__emoji">{animal.emoji}</span>
        <span className="challenge__name">{animal.name}</span>
      </div>

      <button className="btn btn--ghost" onClick={() => playReference(animal.sound).catch(() => {})}>
        🔊 Послушать ещё раз
      </button>

      {phase === "idle" && (
        <button className="btn btn--primary" onClick={handleRecord}>
          🎤 Повторить
        </button>
      )}

      {phase === "recording" && (
        <button className="btn btn--recording" onClick={handleStop}>
          ⏹ Стоп (идёт запись…)
        </button>
      )}

      {phase === "scoring" && <p className="status">Сравниваю… 🧠</p>}

      {phase === "result" && result && (
        <div className="result">
          <div className="result__percent">{result.percent}%</div>
          <div className="result__label">{result.label}</div>
          <button className="btn btn--primary" onClick={tryAgain}>
            🔁 Ещё раз
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
