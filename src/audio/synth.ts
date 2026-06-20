// Procedural "cartoon" animal sounds — generated in code, no audio files needed.
// Each spec drives a tiny synth: a pitch contour with optional vibrato, a
// tremolo wobble (for bleats/quacks), gate segments (for barks/oinks), and a
// noise mix (for breathy consonants). The rendered buffer is used both for
// playback and as the reference for MFCC scoring.

const SR = 44100;

type Wave = "sine" | "saw" | "square" | "triangle";
type Breakpoint = [frac: number, freqHz: number]; // frac is 0..1 of duration
type Segment = [startFrac: number, endFrac: number]; // when the sound is "on"

interface SynthSpec {
  duration: number; // seconds
  wave: Wave;
  pitch: Breakpoint[]; // f0 contour over the duration
  vibratoRate?: number; // Hz
  vibratoDepth?: number; // fraction of f0
  tremoloRate?: number; // Hz amplitude wobble
  tremoloDepth?: number; // 0..1
  segments?: Segment[]; // gated on-periods; default whole duration
  noise?: number; // 0..1 mix of white noise
  gain?: number;
}

export const SYNTH_SPECS: Record<string, SynthSpec> = {
  sheep: {
    duration: 0.85, wave: "saw",
    pitch: [[0, 340], [0.1, 365], [1, 300]],
    vibratoRate: 6, vibratoDepth: 0.03, tremoloRate: 18, tremoloDepth: 0.5, noise: 0.05,
  },
  cow: {
    duration: 1.0, wave: "triangle",
    pitch: [[0, 185], [0.2, 170], [1, 135]],
    vibratoRate: 4, vibratoDepth: 0.02, noise: 0.03,
  },
  cat: {
    duration: 0.7, wave: "saw",
    pitch: [[0, 520], [0.3, 820], [0.6, 760], [1, 520]],
    vibratoRate: 5, vibratoDepth: 0.02, noise: 0.03,
  },
  dog: {
    duration: 0.7, wave: "square",
    pitch: [[0, 210], [1, 150]],
    segments: [[0, 0.16], [0.28, 0.46]], noise: 0.35,
  },
  rooster: {
    duration: 0.95, wave: "saw",
    pitch: [[0, 400], [0.2, 660], [0.5, 650], [0.7, 520], [1, 440]],
    noise: 0.05,
  },
  duck: {
    duration: 0.7, wave: "square",
    pitch: [[0, 470], [1, 400]],
    tremoloRate: 22, tremoloDepth: 0.9, noise: 0.15,
  },
  goat: {
    duration: 0.9, wave: "saw",
    pitch: [[0, 300], [1, 255]],
    vibratoRate: 7, vibratoDepth: 0.04, tremoloRate: 14, tremoloDepth: 0.6, noise: 0.05,
  },
  pig: {
    duration: 0.75, wave: "square",
    pitch: [[0, 185], [1, 150]],
    segments: [[0, 0.12], [0.2, 0.32], [0.4, 0.55]], noise: 0.4,
  },
};

function waveform(wave: Wave, phase: number): number {
  const p = phase - Math.floor(phase); // wrap to 0..1
  switch (wave) {
    case "sine": return Math.sin(2 * Math.PI * p);
    case "saw": return 2 * p - 1;
    case "square": return p < 0.5 ? 1 : -1;
    case "triangle": return 4 * Math.abs(p - 0.5) - 1;
  }
}

function pitchAt(pitch: Breakpoint[], frac: number): number {
  for (let i = 1; i < pitch.length; i++) {
    if (frac <= pitch[i][0]) {
      const [f0, hz0] = pitch[i - 1];
      const [f1, hz1] = pitch[i];
      const t = f1 === f0 ? 0 : (frac - f0) / (f1 - f0);
      return hz0 + (hz1 - hz0) * t;
    }
  }
  return pitch[pitch.length - 1][1];
}

/** Amplitude gate: 1 inside an on-segment (with short fades), else 0. */
function gateAt(segments: Segment[] | undefined, frac: number, duration: number): number {
  if (!segments) segments = [[0, 1]];
  const fade = 0.01 / duration; // ~10 ms fades to avoid clicks
  for (const [s, e] of segments) {
    if (frac >= s && frac <= e) {
      const inFade = Math.min((frac - s) / fade, 1);
      const outFade = Math.min((e - frac) / fade, 1);
      return Math.max(0, Math.min(inFade, outFade));
    }
  }
  return 0;
}

/** Render a spec into a mono Float32Array of samples at SR. Pure (no Web Audio). */
export function renderSamples(spec: SynthSpec): Float32Array {
  const len = Math.floor(spec.duration * SR);
  const out = new Float32Array(len);
  const gain = spec.gain ?? 0.6;
  let phase = 0;

  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const frac = i / len;

    let f0 = pitchAt(spec.pitch, frac);
    if (spec.vibratoDepth) {
      f0 *= 1 + spec.vibratoDepth * Math.sin(2 * Math.PI * (spec.vibratoRate ?? 5) * t);
    }
    phase += f0 / SR;

    let amp = gateAt(spec.segments, frac, spec.duration);
    if (spec.tremoloDepth) {
      const wobble = 0.5 + 0.5 * Math.sin(2 * Math.PI * (spec.tremoloRate ?? 12) * t);
      amp *= 1 - spec.tremoloDepth * wobble;
    }

    const osc = waveform(spec.wave, phase);
    const n = spec.noise ? (Math.random() * 2 - 1) * spec.noise : 0;
    out[i] = (osc * (1 - (spec.noise ?? 0)) + n) * amp * gain;
  }
  return out;
}

/** Build an AudioBuffer for an animal id using the given AudioContext. */
export function renderAnimal(id: string, ctx: BaseAudioContext): AudioBuffer {
  const spec = SYNTH_SPECS[id];
  if (!spec) throw new Error(`No synth spec for "${id}"`);
  const samples = renderSamples(spec);
  const buffer = ctx.createBuffer(1, samples.length, SR);
  buffer.getChannelData(0).set(samples);
  return buffer;
}
