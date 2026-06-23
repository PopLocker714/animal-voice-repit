// Score one recorded attempt against an animal's reference sound.
import { audioBufferToAttempt } from "./features";
import { referenceMfcc } from "./reference";
import { dtwDistance } from "./dtw";
import { coverageFactor, distanceToScore, type ScoreResult } from "./score";

// Below these, the recording is effectively silence — no real sound was made.
const SILENCE_PEAK = 0.04; // ~ -28 dBFS
const SILENCE_RMS = 0.01; // ~ -40 dBFS
const MIN_FRAMES = 6; // too short to be a real attempt

export async function scoreAttempt(
  sound: string,
  buffer: AudioBuffer
): Promise<ScoreResult> {
  const [att, refMfcc] = await Promise.all([
    audioBufferToAttempt(buffer),
    referenceMfcc(sound),
  ]);

  // Reject empty/silent recordings outright — don't let normalized noise
  // produce a middling score.
  if (att.peak < SILENCE_PEAK || att.rms < SILENCE_RMS || att.mfcc.length < MIN_FRAMES) {
    console.log(
      `silence: peak=${att.peak.toFixed(3)} rms=${att.rms.toFixed(3)} frames=${att.mfcc.length}`
    );
    return { percent: 0, distance: Infinity, verdict: "verdict.nothingHeard" };
  }

  const distance = dtwDistance(refMfcc, att.mfcc);
  const coverage = coverageFactor(att.mfcc.length, refMfcc.length);
  const result = distanceToScore(distance, coverage);
  console.log(
    `score: d=${distance.toFixed(1)} userFrames=${att.mfcc.length} refFrames=${refMfcc.length} cov=${coverage.toFixed(2)} -> ${result.percent}%`
  );
  return result;
}
