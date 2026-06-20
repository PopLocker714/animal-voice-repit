// Microphone capture. Records from the mic and decodes the result into an
// AudioBuffer so it can go straight through the feature pipeline.
import { decodeAudioFile } from "./features";

export class MicRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  /** Whether the browser exposes the APIs we need (requires a secure context). */
  static isSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined"
    );
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream);
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start();
  }

  /** Stop recording and return the captured audio as an AudioBuffer. */
  async stop(): Promise<AudioBuffer> {
    const recorder = this.recorder;
    if (!recorder) throw new Error("Recorder not started");

    const done = new Promise<Blob>((resolve) => {
      recorder.onstop = () =>
        resolve(new Blob(this.chunks, { type: recorder.mimeType || "audio/webm" }));
    });
    recorder.stop();
    const blob = await done;
    this.cleanup();

    const arrayBuffer = await blob.arrayBuffer();
    return decodeAudioFile(arrayBuffer);
  }

  cancel(): void {
    try {
      this.recorder?.stop();
    } catch {
      /* ignore */
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.recorder = null;
  }
}
