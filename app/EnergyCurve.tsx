"use client";

import { useEffect, useMemo, useRef } from "react";

// Mirrors the real app's EnergyCurveEditor: five control points joined by a
// Catmull-Rom spline, stroked with a vertical energy gradient (intense at the
// top, glacial at the bottom). The "liquid glass" thumbs are faked with a
// backdrop blur rather than the live glassEffect material.

const POINT_COUNT = 5;
const PAD_X = 7; // horizontal inset, in 0–100 viewBox units (== percent)
const PAD_Y = 14; // vertical inset

// Energy bands, top (intense) to bottom (glacial) — Apple system hues.
const GRADIENT_STOPS = [
  { offset: "0%", color: "#ff453a" }, // intense
  { offset: "38%", color: "#bf5af2" }, // energetic
  { offset: "68%", color: "#0a84ff" }, // mellow
  { offset: "100%", color: "#40c8e0" }, // glacial
];

// Per-point oscillation so the curve drifts as if someone is shaping it.
const WAVES = [
  { base: 0.58, amp: 0.32, period: 7100, phase: 0.0 },
  { base: 0.42, amp: 0.4, period: 5300, phase: 1.7 },
  { base: 0.62, amp: 0.3, period: 8200, phase: 3.1 },
  { base: 0.36, amp: 0.42, period: 6100, phase: 4.4 },
  { base: 0.52, amp: 0.34, period: 7700, phase: 5.6 },
];

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

const xs = Array.from(
  { length: POINT_COUNT },
  (_, i) => PAD_X + (100 - 2 * PAD_X) * (i / (POINT_COUNT - 1)),
);

const yForValue = (v: number) => PAD_Y + (100 - 2 * PAD_Y) * (1 - v);

const valueAt = (i: number, t: number) => {
  const w = WAVES[i];
  return clamp(
    w.base + w.amp * Math.sin((2 * Math.PI * t) / w.period + w.phase),
    0.08,
    0.92,
  );
};

// Catmull-Rom through the points, emitted as cubic béziers — same construction
// the app uses (b1 = p1 + (p2 - pPrev)/6, b2 = p2 - (pNext - p1)/6).
function splinePath(ys: number[]) {
  const pts = xs.map((x, i) => ({ x, y: yForValue(ys[i]) }));
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const pPrev = i === 0 ? sub(scale(p1, 2), p2) : pts[i - 1];
    const pNext =
      i === pts.length - 2 ? sub(scale(p2, 2), p1) : pts[i + 2];
    const b1 = add(p1, scale(sub(p2, pPrev), 1 / 6));
    const b2 = sub(p2, scale(sub(pNext, p1), 1 / 6));
    d += ` C ${b1.x.toFixed(2)} ${b1.y.toFixed(2)} ${b2.x.toFixed(2)} ${b2.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

type Pt = { x: number; y: number };
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const scale = (a: Pt, s: number): Pt => ({ x: a.x * s, y: a.y * s });

export default function EnergyCurve() {
  const pathRef = useRef<SVGPathElement>(null);
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Static first-paint values (also the reduced-motion resting state).
  const initial = useMemo(() => WAVES.map((_, i) => valueAt(i, 0)), []);
  const initialPath = useMemo(() => splinePath(initial), [initial]);

  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let raf = 0;
    const tick = () => {
      const t = performance.now();
      const ys = WAVES.map((_, i) => valueAt(i, t));
      pathRef.current?.setAttribute("d", splinePath(ys));
      ys.forEach((v, i) => {
        const thumb = thumbRefs.current[i];
        if (thumb) thumb.style.top = `${yForValue(v)}%`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-hairline bg-foreground/[0.03]">
      {/* dot-grid backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 text-foreground/20"
        style={{
          backgroundImage:
            "radial-gradient(currentColor 1px, transparent 1.4px)",
          backgroundSize: "26px 26px",
          backgroundPosition: "center",
          maskImage:
            "radial-gradient(120% 100% at 50% 50%, black 60%, transparent 100%)",
        }}
      />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient
            id="energy-gradient"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="0"
            y2="100"
          >
            {GRADIENT_STOPS.map((s) => (
              <stop key={s.offset} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          d={initialPath}
          fill="none"
          stroke="url(#energy-gradient)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.18))" }}
        />
      </svg>

      {/* axis labels */}
      <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-background/55 px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-muted backdrop-blur-sm">
        Intense
      </span>
      <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-background/55 px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-muted backdrop-blur-sm">
        Glacial
      </span>

      {/* liquid-glass control points (faked with backdrop-blur) */}
      {xs.map((x, i) => (
        <div
          key={i}
          ref={(el) => {
            thumbRefs.current[i] = el;
          }}
          className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/15 shadow-lg shadow-black/20 backdrop-blur-md dark:border-white/25"
          style={{ left: `${x}%`, top: `${yForValue(initial[i])}%` }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/60" />
        </div>
      ))}
    </div>
  );
}
