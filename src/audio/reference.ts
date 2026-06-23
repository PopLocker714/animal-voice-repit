// Loads a reference animal sound and exposes play() + its MFCC for scoring.
// Two sources are supported by the `sound` key on an animal:
//   "synth:<id>"  -> generated procedurally (src/audio/synth.ts), no file needed
//   "/path.mp3"   -> fetched and decoded from /public
// Decoded buffers and their MFCC sequences are cached so re-attempts are instant.
import { audioBufferToMfcc, decodeAudioFile, type MfccSequence } from "./features";
import { renderAnimal } from "./synth";

interface RefData {
  buffer: AudioBuffer;
  mfcc: MfccSequence;
}

const cache = new Map<string, Promise<RefData>>();
let playbackCtx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!playbackCtx) playbackCtx = new AudioContext();
  return playbackCtx;
}

async function load(sound: string): Promise<RefData> {
  let buffer: AudioBuffer;
  if (sound.startsWith("synth:")) {
    buffer = renderAnimal(sound.slice("synth:".length), ctx());
  } else {
    const res = await fetch(sound);
    if (!res.ok) throw new Error(`Sound not found: ${sound} (${res.status})`);
    buffer = await decodeAudioFile(await res.arrayBuffer());
  }
  const mfcc = await audioBufferToMfcc(buffer);
  return { buffer, mfcc };
}

function getRef(sound: string): Promise<RefData> {
  let entry = cache.get(sound);
  if (!entry) {
    entry = load(sound);
    cache.set(sound, entry);
  }
  return entry;
}

/**
 * Play the reference sound. The returned promise resolves when playback
 * finishes — callers can await it to block recording until the sound is done.
 */
export async function playReference(sound: string): Promise<void> {
  const { buffer } = await getRef(sound);
  const audioCtx = ctx();
  if (audioCtx.state === "suspended") {
    try {
      await audioCtx.resume();
    } catch {
      /* ignore — start() below will still attempt playback */
    }
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.connect(audioCtx.destination);
  await new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    src.onended = finish;
    try {
      src.start();
    } catch {
      finish();
      return;
    }
    // Safety net in case `onended` never fires (e.g. context issues).
    setTimeout(finish, buffer.duration * 1000 + 400);
  });
}

/** Get the reference MFCC sequence (cached) for scoring. */
export async function referenceMfcc(sound: string): Promise<MfccSequence> {
  const { mfcc } = await getRef(sound);
  return mfcc;
}
