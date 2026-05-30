"use client"

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react"
import { energyColors, type EnergyBand } from "./energyColors"

// A cycler through real "Hey Siri" phrases. Each phrase animates in
// letter-by-letter — a flip-clock cascade of translate + blur (keyframes in
// globals.css, staggered via inline animation-delay) — holds, then rolls out
// and the next one rolls in. Energy-band words wear the app's band hues, over a
// gradient bloom in the phrase's accent colour that grows and fades each cycle.

type Token = { text: string; band?: EnergyBand }

const PHRASES: Token[][] = [
  [{ text: "Make a playlist with Playback" }],
  [{ text: "Play hidden gems with Playback" }],
  [
    { text: "Design a " },
    { text: "mellow", band: "mellow" },
    { text: " playlist with Playback" },
  ],
  [
    { text: "Make an " },
    { text: "intense", band: "intense" },
    { text: " playlist with Playback" },
  ],
  [
    { text: "Spin up an " },
    { text: "energetic", band: "energetic" },
    { text: " mix with Playback" },
  ],
  [
    { text: "Wind down with a " },
    { text: "glacial", band: "glacial" },
    { text: " set on Playback" },
  ],
  [{ text: "Play a random playlist with Playback" }],
  [{ text: "Save that to my library with Playback" }],
]

const CHAR_STAGGER = 26 // ms between successive letters starting to move
const CHAR_DURATION = 520 // ms each letter takes (matches .siri-letter-in)
const OUT_DURATION = 340 // matches .siri-letter-out
const HOLD = 1900 // ms a phrase rests fully shown

type Letter = { ch: string; band?: EnergyBand; delay: number }

// Group a phrase into whole words (so nothing breaks mid-word), each word a
// list of letters carrying a global, monotonically-increasing animation delay
// for the cascade.
function toWords(phrase: Token[]): { words: Letter[][]; count: number } {
  const words: Letter[][] = []
  let current: Letter[] = []
  let i = 0
  const flush = () => {
    if (current.length) words.push(current)
    current = []
  }
  for (const tok of phrase) {
    for (const ch of tok.text) {
      if (ch === " ") {
        flush()
      } else {
        current.push({ ch, band: tok.band, delay: i * CHAR_STAGGER })
        i++
      }
    }
  }
  flush()
  return { words, count: i }
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", notify)
      return () => mq.removeEventListener("change", notify)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false // server snapshot: assume motion is allowed
  )
}

export default function SiriPhrases() {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<"in" | "out">("in")
  const reduced = usePrefersReducedMotion()

  const { words, count } = useMemo(() => toWords(PHRASES[index]), [index])
  const colors = useMemo(() => phraseAccents(index), [index])
  // Span the phrase's visible window (in + hold), not the whole cycle — a
  // snappier bloom that's gone by the time the phrase rolls out.
  const bloomMs = count * CHAR_STAGGER + CHAR_DURATION + HOLD

  useEffect(() => {
    if (reduced) return
    if (phase === "in") {
      const t = setTimeout(
        () => setPhase("out"),
        count * CHAR_STAGGER + CHAR_DURATION + HOLD
      )
      return () => clearTimeout(t)
    }
    const t = setTimeout(
      () => {
        setIndex((i) => (i + 1) % PHRASES.length)
        setPhase("in")
      },
      count * CHAR_STAGGER + OUT_DURATION
    )
    return () => clearTimeout(t)
  }, [index, phase, reduced, count])

  return (
    <div className="relative rounded-3xl inset-ring-1 inset-ring-foreground/10 bg-foreground/[0.02] px-6 py-12 sm:px-8">
      <Bloom key={index} colors={colors} durationMs={bloomMs} />
      {/* Height is reserved for the longest phrase (two lines on a phone) so
          the panel never resizes as phrases cycle; the text vertically
          centres within it. */}
      <div className="relative flex min-h-[6em] justify-center items-center">
        <p
          // Re-key per phase so the CSS animations restart from the top.
          key={reduced ? "static" : `${index}-${phase}`}
          className="flex flex-wrap gap-x-[0.3em] gap-y-1 font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl"
        >
          {words.map((word, wi) => (
            <span key={wi} className="inline-flex">
              {word.map((c, ci) => (
                <span
                  key={ci}
                  className={
                    reduced
                      ? "siri-letter"
                      : phase === "in"
                        ? "siri-letter siri-letter-in"
                        : "siri-letter siri-letter-out"
                  }
                  style={{
                    animationDelay: reduced ? undefined : `${c.delay}ms`,
                    color: c.band ? energyColors[c.band] : undefined,
                  }}
                >
                  {c.ch}
                </span>
              ))}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}

// Two complementary washes that bloom in, brighten, and drift past each other
// (opposite arcs) before fading — they cross in the middle so the colours
// blend. Re-keyed per phrase so it restarts each cycle; clipped to the panel.
function Bloom({
  colors,
  durationMs,
}: {
  colors: [string, string]
  durationMs: number
}) {
  const dur = { "--bloom-dur": `${durationMs}ms` } as CSSProperties
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl opacity-25"
    >
      <div
        className="siri-bloom absolute left-1/2 top-full aspect-square w-[120%]"
        style={{
          ...dur,
          background: `radial-gradient(circle, ${colors[0]} 0%, ${fade(colors[0])} 60%)`,
          filter: "blur(46px)",
        }}
      />
      <div
        className="siri-bloom-alt absolute left-1/2 top-full aspect-square w-[120%]"
        style={{
          ...dur,
          background: `radial-gradient(circle, ${colors[1]} 0%, ${fade(colors[1])} 60%)`,
          filter: "blur(46px)",
        }}
      />
    </div>
  )
}

// Richer OKLCH bloom pairs per band — harmonious, analogous hues (not the
// jarring complementary combos). High chroma so the wash reads as colour, not
// grey, on both backgrounds.
const BLOOM_PAIRS: Record<EnergyBand, [string, string]> = {
  glacial: ["oklch(0.78 0.13 192)", "oklch(0.76 0.18 152)"], // teal + green
  mellow: ["oklch(0.66 0.18 248)", "oklch(0.78 0.13 192)"], // blue + teal
  energetic: ["oklch(0.66 0.18 248)", "oklch(0.60 0.21 304)"], // blue + purple
  intense: ["oklch(0.64 0.24 25)", "oklch(0.73 0.19 64)"], // red + orange
}

// Make a colour fully transparent while keeping its hue, so the radial fades to
// nothing without a grey dead-zone. Works for OKLCH (insert `/ 0` alpha).
function fade(color: string): string {
  return color.replace(/\)\s*$/, " / 0)")
}

// The two-colour bloom for a phrase: a band phrase uses its band's pair;
// band-less phrases cycle the four pairs by index so they still vary.
function phraseAccents(index: number): [string, string] {
  const band = PHRASES[index].find((t) => t.band)?.band
  if (band) return BLOOM_PAIRS[band]
  const order: EnergyBand[] = ["intense", "mellow", "energetic", "glacial"]
  return BLOOM_PAIRS[order[index % order.length]]
}
