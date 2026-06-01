"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"

// A Cover Flow–style carousel of album art from the user's library: the centre
// cover faces forward while neighbours angle inward and spill past the panel
// edges. It advances one cover at a time — ease across, rest a beat, ease to
// the next — and loops forever, picturing the "endless rotation" the Songs
// feature describes. Positions are computed from a single fractional cursor `p`
// and written straight to the DOM each frame (à la EnergyCurve) rather than
// through React state.

const COVERS = Array.from(
  { length: 10 },
  (_, i) => `/covers/IMG_${5467 + i}.jpeg`
)
const N = COVERS.length

const ADVANCE = 1250 // ms to ease from one cover to the next
const HOLD = 1250 // ms a cover rests at centre before the next advance

const MAX_ROTATION = -15 // deg the side covers angle toward the centre
const NEAR_GAP = 110 // % of cover width between centre and first neighbour
const SIDE_GAP = 100 // % between successive covers once past the first
const NEAR_DEPTH = 110 // px the first neighbour sinks back
const SIDE_DEPTH = 10 // px each further cover sinks
const FADE_START = 2.5 // covers this far out begin to fade
const FADE_END = 3.8 // …and are gone by here (hidden well before they wrap)

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v))

// Underdamped spring: the unit step response of a second-order system, so each
// advance overshoots the centre by a hair and settles back. DAMP/FREQ are tuned
// for a damping ratio ~0.67 (≈6% overshoot) that's fully settled by t=1 — a
// subtle spring, not a bounce. Lower DAMP (or raise FREQ) for more overshoot.
const DAMP = 8
const FREQ = 5.5
const ease = (t: number) =>
  1 -
  Math.exp(-DAMP * t) *
    (Math.cos(FREQ * t) + (DAMP / FREQ) * Math.sin(FREQ * t))

// Signed distance from the cursor to cover `i`, wrapped into [-N/2, N/2) so the
// strip is a seamless loop: a cover leaving at -N/2 re-enters at +N/2.
const offset = (i: number, p: number) => {
  const half = N / 2
  return ((((i - p + half) % N) + N) % N) - half
}

const transformFor = (o: number) => {
  const sign = Math.sign(o)
  const mag = Math.abs(o)
  const x =
    sign * (NEAR_GAP * Math.min(mag, 1) + SIDE_GAP * Math.max(mag - 1, 0))
  const z = -(NEAR_DEPTH * Math.min(mag, 1) + SIDE_DEPTH * Math.max(mag - 1, 0))
  const rotateY = -clamp(o, -1, 1) * MAX_ROTATION
  const scale = 1 - 0.05 * Math.min(mag, 1) - 0.06 * Math.max(mag - 1, 0)
  return `translate(-50%, -50%) translateX(${x}%) translateZ(${z}px) rotateY(${rotateY}deg) scale(${scale})`
}

const opacityFor = (o: number) =>
  clamp((FADE_END - Math.abs(o)) / (FADE_END - FADE_START), 0, 1)

const zIndexFor = (o: number) => String(Math.round(1000 - Math.abs(o) * 100))

export default function SongCarousel() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    let raf = 0
    let from = 0
    let cycleStart = performance.now()

    const tick = (now: number) => {
      const elapsed = now - cycleStart
      let p: number
      if (elapsed < ADVANCE) {
        p = from + ease(elapsed / ADVANCE)
      } else {
        p = from + 1
        if (elapsed >= ADVANCE + HOLD) {
          from += 1
          cycleStart = now
          p = from
        }
      }
      cardRefs.current.forEach((card, i) => {
        if (!card) return
        const o = offset(i, p)
        card.style.transform = transformFor(o)
        card.style.opacity = String(opacityFor(o))
        card.style.zIndex = zIndexFor(o)
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl inset-ring inset-ring-foreground/10 bg-foreground/[0.03]">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ perspective: "1100px", transformStyle: "preserve-3d" }}
      >
        {COVERS.map((src, i) => {
          const o = offset(i, 0)
          return (
            <div
              key={src}
              ref={(el) => {
                cardRefs.current[i] = el
              }}
              className="absolute left-1/2 top-1/2 w-[clamp(8rem,46%,13rem)] aspect-square will-change-transform"
              style={{
                transform: transformFor(o),
                opacity: opacityFor(o),
                zIndex: zIndexFor(o),
              }}
            >
              {/* Chromatic shadow: a blurred copy of the same art bleeding its
                  colours out behind the cover, sunk back in Z so it reads as a
                  coloured glow on the floor rather than a flat grey drop. */}
              <Image
                aria-hidden
                src={src}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, 240px"
                loading="eager"
                className="rounded-xl object-cover opacity-20 blur-xl brightness-50 saturation-150"
                style={{
                  transform: "translateY(6%) scale(0.92) translateZ(-1px)",
                }}
              />
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, 240px"
                loading="eager"
                className="rounded-xl object-cover shadow-xl shadow-black/15"
              />
              {/* Drawn over the image: an inset box-shadow on the <img> itself
                  would be hidden beneath the replaced-element pixels. */}
              <div className="pointer-events-none absolute inset-0 rounded-xl inset-ring inset-ring-foreground/10" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
