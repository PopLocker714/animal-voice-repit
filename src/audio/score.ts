// Convert a raw DTW distance into a friendly 0-100% similarity score.
//
// The mapping is a logistic (sigmoid) curve. Two parameters control it:
//   MIDPOINT  — distance that maps to ~50%
//   STEEPNESS — how fast the score falls as distance grows
// Maps DTW distance → score. Tuned to be encouraging (kids game): a child
// imitating with their own voice lands far from the reference recording, so the
// curve is shifted to be generous — a decent try (d≈40) ≈ 80%, a good one
// (d≈25) ≈ 86%, an excellent one (d<15) reaches 90%+. Not "anything passes":
// a wrong/very-off attempt (d≈120) still lands ~26%. Console logs raw distance.
const MIDPOINT = 85;
const STEEPNESS = 0.03;

export interface ScoreResult {
  percent: number; // 0..100
  distance: number; // raw DTW distance, for calibration/debugging
  verdict: string; // i18n key, localized at render time
}

function verdictFor(percent: number): string {
  if (percent >= 90) return "verdict.perfect";
  if (percent >= 75) return "verdict.veryClose";
  if (percent >= 55) return "verdict.notBad";
  if (percent >= 35) return "verdict.couldBetter";
  return "verdict.tryAgain";
}

/**
 * Coverage factor in [0,1] from how the attempt's length compares to the
 * reference. DTW's path-length normalization otherwise rewards very short
 * recordings (a tiny clip "stretches" to match the reference and gets a
 * deceptively low distance). This penalizes attempts that are much shorter
 * (and, mildly, much longer) than the reference.
 *   userLen / refLen are MFCC frame counts (after silence trimming).
 */
export function coverageFactor(userLen: number, refLen: number): number {
  if (refLen === 0) return 0;
  const ratio = userLen / refLen;
  if (ratio >= 0.6 && ratio <= 1.8) return 1; // close enough in length
  if (ratio < 0.6) return Math.max(0, ratio / 0.6); // too short → strong penalty
  return Math.max(0.4, 1.8 / ratio); // too long → mild penalty
}

export function distanceToScore(distance: number, coverage = 1): ScoreResult {
  if (!isFinite(distance)) {
    return { percent: 0, distance, verdict: "verdict.nothingHeard" };
  }
  const raw = 1 / (1 + Math.exp(STEEPNESS * (distance - MIDPOINT)));
  const adjusted = Math.max(0, Math.min(1, raw)) * coverage;
  const percent = Math.round(Math.max(0, Math.min(1, adjusted)) * 100);
  return { percent, distance, verdict: verdictFor(percent) };
}
