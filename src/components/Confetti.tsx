import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
  rect: boolean;
}

const COLORS = ["#7c3aed", "#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#ec4899", "#fbbf24"];

/** A one-shot confetti burst on a full-screen canvas overlay. */
export function Confetti({ duration = 2600 }: { duration?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const W = window.innerWidth;
    const H = window.innerHeight;
    // Two side cannons firing toward the centre-top.
    const parts: Particle[] = [];
    const spawn = (originX: number, dir: number) => {
      for (let i = 0; i < 70; i++) {
        parts.push({
          x: originX,
          y: H * 0.32,
          vx: dir * (Math.random() * 6 + 2),
          vy: Math.random() * -11 - 5,
          g: 0.2 + Math.random() * 0.12,
          size: 6 + Math.random() * 7,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.35,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          rect: Math.random() < 0.5,
        });
      }
    };
    spawn(W * 0.15, 1);
    spawn(W * 0.85, -1);

    const start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const alpha = Math.max(0, 1 - t / duration);
      for (const p of parts) {
        p.vy += p.g;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        if (p.rect) ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
        else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (t < duration) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [duration]);

  return <canvas ref={ref} className="confetti-canvas" aria-hidden="true" />;
}
