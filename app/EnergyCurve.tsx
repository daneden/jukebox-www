"use client"

import { useEffect, useMemo, useRef } from "react"
import { energyColors } from "./energyColors"
import { useInView } from "./useInView"

// Mirrors the real app's EnergyCurveEditor: five control points joined by a
// Catmull-Rom spline, stroked with a vertical energy gradient (intense at the
// top, glacial at the bottom). The "liquid glass" thumbs are faked with a
// backdrop blur rather than the live glassEffect material.

const POINT_COUNT = 5
const PAD_X = 7 // horizontal inset, in 0–100 viewBox units (== percent)
const PAD_Y = 14 // vertical inset

// Energy bands, top (intense) to bottom (glacial) — Apple system hues.
const GRADIENT_STOPS = [
  { offset: "20%", color: energyColors.intense },
  { offset: "40%", color: energyColors.energetic },
  { offset: "60%", color: energyColors.mellow },
  { offset: "80%", color: energyColors.glacial },
]

// The curve animates point-by-point (staggered) to a fresh random target,
// holds, then transitions to the next one — forever.
const VALUE_MIN = 0.05
const VALUE_MAX = 0.95
const STAGGER = 120 // ms between successive points starting to move
const DURATION = 1200 // ms each point takes to reach its target
const HOLD = 1600 // ms the curve rests once fully settled

// Deterministic resting curve for first paint + reduced-motion fallback.
const INITIAL = [0.55, 0.4, 0.62, 0.34, 0.5]

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v))

// easeInOutQuart
const ease = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2

const randomCurve = () =>
  Array.from(
    { length: POINT_COUNT },
    () => VALUE_MIN + Math.random() * (VALUE_MAX - VALUE_MIN)
  )

const xs = Array.from(
  { length: POINT_COUNT },
  (_, i) => PAD_X + (100 - 2 * PAD_X) * (i / (POINT_COUNT - 1))
)

const yForValue = (v: number) => PAD_Y + (100 - 2 * PAD_Y) * (1 - v)

// Catmull-Rom through the points, emitted as cubic béziers — same construction
// the app uses (b1 = p1 + (p2 - pPrev)/6, b2 = p2 - (pNext - p1)/6).
function splinePath(ys: number[]) {
  const pts = xs.map((x, i) => ({ x, y: yForValue(ys[i]) }))
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const pPrev = i === 0 ? sub(scale(p1, 2), p2) : pts[i - 1]
    const pNext = i === pts.length - 2 ? sub(scale(p2, 2), p1) : pts[i + 2]
    const b1 = add(p1, scale(sub(p2, pPrev), 1 / 6))
    const b2 = sub(p2, scale(sub(pNext, p1), 1 / 6))
    d += ` C ${b1.x.toFixed(2)} ${b1.y.toFixed(2)} ${b2.x.toFixed(2)} ${b2.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

type Pt = { x: number; y: number }
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y })
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y })
const scale = (a: Pt, s: number): Pt => ({ x: a.x * s, y: a.y * s })

export default function EnergyCurve() {
  const pathRef = useRef<SVGPathElement>(null)
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([])
  const [rootRef, inView] = useInView<HTMLDivElement>()

  const initialPath = useMemo(() => splinePath(INITIAL), [])

  useEffect(() => {
    if (!inView) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    let raf = 0
    let from = [...INITIAL]
    let to = randomCurve()
    let cycleStart = performance.now()

    // Thumbs are laid out at their resting (INITIAL) `top`; per-frame motion is
    // a transform offset from there, so we never touch the layout-triggering
    // `top` property mid-animation. The offset is in px, so we need the panel's
    // height — measured here and kept fresh on resize.
    let hostHeight = rootRef.current?.clientHeight ?? 0
    const measure = () => {
      hostHeight = rootRef.current?.clientHeight ?? 0
    }
    window.addEventListener("resize", measure)

    // When the last (most-delayed) point finishes its transition.
    const settledAt = () => cycleStart + (POINT_COUNT - 1) * STAGGER + DURATION

    const tick = () => {
      const now = performance.now()
      if (now >= settledAt() + HOLD) {
        from = to
        to = randomCurve()
        cycleStart = now
      }

      const ys = from.map((f, i) => {
        const p = clamp((now - (cycleStart + i * STAGGER)) / DURATION, 0, 1)
        const v = f + (to[i] - f) * ease(p)
        // Nudge the thumb larger while it's mid-move, like grabbing it.
        const grab = 1 + 0.16 * Math.sin(p * Math.PI)
        const thumb = thumbRefs.current[i]
        if (thumb) {
          // Vertical delta from the resting position, as a transform — keeps
          // the thumb on the compositor instead of re-laying-out every frame.
          const dy = ((yForValue(v) - yForValue(INITIAL[i])) / 100) * hostHeight
          thumb.style.transform = `translate(-50%, calc(-50% + ${dy.toFixed(1)}px)) scale(${grab.toFixed(3)})`
        }
        return v
      })
      pathRef.current?.setAttribute("d", splinePath(ys))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", measure)
    }
  }, [inView, rootRef])

  return (
    <div
      ref={rootRef}
      className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl inset-ring inset-ring-foreground/10 bg-foreground/[0.03]"
    >
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
          strokeWidth={8}
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
            thumbRefs.current[i] = el
          }}
          className="absolute flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-white/25 shadow-lg shadow-black/10 backdrop-blur-xs dark:border-white/15 dark:bg-background/25"
          style={{
            left: `${x}%`,
            top: `${yForValue(INITIAL[i])}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  )
}
