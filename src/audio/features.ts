// Audio feature extraction: decode -> mono -> resample -> trim -> normalize -> MFCC.
// The MFCC sequence is what we compare between the animal sound and the user's attempt.
import Meyda from "meyda";

export const TARGET_SR = 16000; // resample everything to 16 kHz before analysis
const FRAME_SIZE = 512; // power of two, required by Meyda's FFT
const HOP_SIZE = 256; // 50% overlap between frames
const MFCC_COEFFS = 13;

export type MfccSequence = number[][]; // one 13-dim vector per frame

/** Decode an encoded audio file (mp3/ogg/wav) into an AudioBuffer. */
export async function decodeAudioFile(data: ArrayBuffer): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(1, 1, TARGET_SR);
  return ctx.decodeAudioData(data.slice(0));
}

/** Downmix any AudioBuffer to a single mono channel. */
function toMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0).slice();
  const length = buffer.length;
  const out = new Float32Array(length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) out[i] += data[i];
  }
  for (let i = 0; i < length; i++) out[i] /= buffer.numberOfChannels;
  return out;
}

/** Resample a mono AudioBuffer to TARGET_SR using an OfflineAudioContext. */
async function resampleToTarget(buffer: AudioBuffer): Promise<Float32Array> {
  if (buffer.sampleRate === TARGET_SR) return toMono(buffer);

  const duration = buffer.duration;
  const offline = new OfflineAudioContext(
    1,
    Math.ceil(duration * TARGET_SR),
    TARGET_SR
  );
  const src = offline.createBufferSource();
  src.buffer = buffer;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0).slice();
}

/** Trim leading/trailing near-silence using a short-window RMS gate. */
function trimSilence(signal: Float32Array, sr: number): Float32Array {
  const win = Math.floor(sr * 0.02); // 20 ms windows
  if (signal.length < win * 2) return signal;

  // Find peak RMS to set a relative threshold (robust to overall loudness).
  let peakRms = 0;
  const rmsAt = (start: number): number => {
    let sum = 0;
    const end = Math.min(start + win, signal.length);
    for (let i = start; i < end; i++) sum += signal[i] * signal[i];
    return Math.sqrt(sum / (end - start));
  };
  for (let i = 0; i < signal.length; i += win) peakRms = Math.max(peakRms, rmsAt(i));

  const threshold = Math.max(peakRms * 0.1, 0.005);
  let start = 0;
  let end = signal.length;
  while (start < signal.length && rmsAt(start) < threshold) start += win;
  while (end > start && rmsAt(Math.max(end - win, 0)) < threshold) end -= win;

  const trimmed = signal.subarray(Math.max(0, start), Math.min(signal.length, end));
  return trimmed.length > FRAME_SIZE ? trimmed.slice() : signal.slice();
}

/** Peak-normalize so loudness differences don't dominate the comparison. */
function normalizePeak(signal: Float32Array): Float32Array {
  let peak = 0;
  for (let i = 0; i < signal.length; i++) peak = Math.max(peak, Math.abs(signal[i]));
  // Don't amplify near-silence — that would blow faint room noise up to full
  // scale and make an empty recording look like real signal.
  if (peak < 0.02) return signal;
  const gain = 0.95 / peak;
  const out = new Float32Array(signal.length);
  for (let i = 0; i < signal.length; i++) out[i] = signal[i] * gain;
  return out;
}

/** Peak amplitude and RMS of a signal (used to detect silent recordings). */
function levels(signal: Float32Array): { peak: number; rms: number } {
  let peak = 0;
  let sum = 0;
  for (let i = 0; i < signal.length; i++) {
    const v = signal[i];
    const a = Math.abs(v);
    if (a > peak) peak = a;
    sum += v * v;
  }
  return { peak, rms: signal.length ? Math.sqrt(sum / signal.length) : 0 };
}

/** Slide a window over the signal and extract one MFCC vector per frame. */
function computeMfcc(signal: Float32Array): MfccSequence {
  Meyda.sampleRate = TARGET_SR;
  Meyda.bufferSize = FRAME_SIZE;
  Meyda.windowingFunction = "hanning";
  Meyda.numberOfMFCCCoefficients = MFCC_COEFFS;

  const frames: MfccSequence = [];
  for (let start = 0; start + FRAME_SIZE <= signal.length; start += HOP_SIZE) {
    const frame = signal.subarray(start, start + FRAME_SIZE);
    const mfcc = Meyda.extract("mfcc", frame) as number[] | null;
    if (mfcc && mfcc.length === MFCC_COEFFS) frames.push(mfcc);
  }
  return frames;
}

/** Full pipeline: AudioBuffer -> normalized MFCC sequence ready for DTW. */
export async function audioBufferToMfcc(buffer: AudioBuffer): Promise<MfccSequence> {
  const resampled = await resampleToTarget(buffer);
  const trimmed = trimSilence(resampled, TARGET_SR);
  const normalized = normalizePeak(trimmed);
  return computeMfcc(normalized);
}

export interface AttemptAnalysis {
  mfcc: MfccSequence;
  peak: number; // loudness of the actual (trimmed) content, pre-normalization
  rms: number;
}

/** Like audioBufferToMfcc, but also reports loudness so callers can reject
 *  silent recordings (peak/rms measured before normalization). */
export async function audioBufferToAttempt(buffer: AudioBuffer): Promise<AttemptAnalysis> {
  const resampled = await resampleToTarget(buffer);
  const trimmed = trimSilence(resampled, TARGET_SR);
  const { peak, rms } = levels(trimmed);
  const normalized = normalizePeak(trimmed);
  return { mfcc: computeMfcc(normalized), peak, rms };
}

/** Convenience: encoded file bytes -> MFCC sequence. */
export async function fileToMfcc(data: ArrayBuffer): Promise<MfccSequence> {
  const buffer = await decodeAudioFile(data);
  return audioBufferToMfcc(buffer);
}
