// Convert a raw DTW distance into a friendly 0-100% similarity score.
//
// The mapping is a logistic (sigmoid) curve. Two parameters control it:
//   MIDPOINT  — distance that maps to ~50%
//   STEEPNESS — how fast the score falls as distance grows
// Calibrated against the real sound set (see scripts in git history): measured
// DTW distances were self≈0, a good (pitch/tempo-shifted) imitation≈25, a
// different animal≈85. Fit so identical→~92%, good imitation→~82%,
// wrong animal→~35%. The Challenge screen still logs raw distance for retuning.
const MIDPOINT = 67.8;
const STEEPNESS = 0.0354;

export interface ScoreResult {
  percent: number; // 0..100
  distance: number; // raw DTW distance, for calibration/debugging
  label: string; // short verdict shown to the user
}

function verdictFor(percent: number): string {
  if (percent >= 90) return "Идеально! 🌟";
  if (percent >= 75) return "Очень похоже! 🎉";
  if (percent >= 55) return "Неплохо 👍";
  if (percent >= 35) return "Можно лучше 🙂";
  return "Попробуй ещё раз 🔁";
}

export function distanceToScore(distance: number): ScoreResult {
  if (!isFinite(distance)) {
    return { percent: 0, distance, label: "Ничего не услышал 🤔" };
  }
  const raw = 1 / (1 + Math.exp(STEEPNESS * (distance - MIDPOINT)));
  const percent = Math.round(Math.max(0, Math.min(1, raw)) * 100);
  return { percent, distance, label: verdictFor(percent) };
}
