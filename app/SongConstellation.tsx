"use client"

import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { energyColors, type EnergyBand } from "./energyColors"
import { useInView } from "./useInView"

// A picture of the Songs curation walk. Each track is a node placed in a 2-D
// projection of its 512-d sonic signature (Apple's AudioFeaturePrint), so
// sonically-similar songs cluster. Faint edges are the similarity graph; the
// algorithm walks it track-to-track, always toward a near neighbour, drawing a
// glowing path. Each hop is annotated with its genre lineage (a faithful
// mini-port of the app's GenreSimilarity scoring) and the destination's
// detected BPM, with a dot beating at that tempo. The arriving node glows in
// its energy-band hue — the "weighing similarity, energy…" the feature
// describes. Positions/styles are written straight to the DOM each frame (à la
// EnergyCurve / SongCarousel) rather than through React state.

type Node = {
  x: number // 0–100, percent across the panel
  y: number
  genre: string
  bpm: number // detected tempo, 60–180
  energy: EnergyBand
}

// Nodes 0–10 are the walked path (declared in tour order); node 11 sits in the
// field as an un-walked neighbour — the walk stays in similar territory rather
// than visiting everything. Positions are centred in the frame.
const NODES: Node[] = [
  { x: 28, y: 63, genre: "Ska", bpm: 140, energy: "energetic" },
  { x: 18, y: 53, genre: "Roots Reggae", bpm: 76, energy: "mellow" },
  { x: 26, y: 49, genre: "Reggae", bpm: 80, energy: "mellow" },
  { x: 35, y: 57, genre: "Dub", bpm: 70, energy: "glacial" },
  { x: 44, y: 63, genre: "Dubstep", bpm: 140, energy: "intense" },
  { x: 72, y: 23, genre: "Techno", bpm: 130, energy: "intense" },
  { x: 82, y: 17, genre: "Trance", bpm: 138, energy: "intense" },
  { x: 76, y: 35, genre: "House", bpm: 124, energy: "energetic" },
  { x: 64, y: 39, genre: "Disco", bpm: 118, energy: "energetic" },
  { x: 52, y: 73, genre: "Funk", bpm: 112, energy: "energetic" },
  { x: 44, y: 81, genre: "Soul", bpm: 96, energy: "mellow" },
  { x: 60, y: 83, genre: "Hip-Hop/Rap", bpm: 90, energy: "mellow" },
]

// The order the walk visits nodes. Each step lands on a lineage-related
// neighbour, so the scores below read as meaningful.
const TOUR = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// The static similarity graph drawn faintly behind the walk: pairs of nodes
// that share a genre lineage. The walk lights a path across it.
const EDGES: [number, number][] = [
  [0, 1], [0, 2], [1, 2], [2, 3], [3, 4], // reggae spine
  [4, 5], // Dubstep → Techno: the surprising cross-cluster bridge
  [5, 6], [5, 7], [6, 7], [7, 8], // electronic
  [8, 9], [9, 10], [9, 11], // funk / soul / hip-hop
]

// Genre lineage chains, mirroring GenreSimilarity.swift: ordered stylistic
// descent. Includes the "Reggae → Dub → Dubstep → Techno → House" bridge that
// links reggae to dance music — the connection basic string matching misses.
const CHAINS: string[][] = [
  ["Ska", "Reggae", "Roots Reggae"],
  ["Reggae", "Dub", "Dubstep", "Techno", "House"],
  ["Funk", "Disco", "House"],
  ["Disco", "Post-Disco", "House"],
  ["House", "Techno", "Trance"],
  ["Soul", "Funk", "Disco"],
  ["Funk", "Hip-Hop/Rap"],
  ["Punk", "Post-Punk", "New Wave"],
  ["New Wave", "Synth-Pop"],
]

// Graded partial credit by window distance along a shared chain — exact 1.0,
// adjacent 0.6, skip-one 0.3, skip-two 0.1 — taking the best over all chains.
function lineageScore(a: string, b: string): number {
  if (a === b) return 1
  let best = 0
  for (const chain of CHAINS) {
    const ia = chain.indexOf(a)
    const ib = chain.indexOf(b)
    if (ia < 0 || ib < 0) continue
    const d = Math.abs(ia - ib)
    const s = d === 1 ? 0.6 : d === 2 ? 0.3 : d === 3 ? 0.1 : 0
    if (s > best) best = s
  }
  return best
}

const ADVANCE = 950 // ms to travel from one node to the next
const HOLD = 750 // ms the comet rests on a node before moving on
const FADE = 700 // ms the whole path fades before the walk restarts
const CHAR_STAGGER = 26 // ms between letters as a label flips in
const COLLAPSE_STAGGER = 16 // ms between letters as a label collapses out (snappier)

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v))

// Underdamped spring (same construction as SongCarousel): each arrival
// overshoots the node by a hair and settles, so hops feel alive.
const DAMP = 8
const FREQ = 5.5
const ease = (t: number) =>
  1 -
  Math.exp(-DAMP * t) *
    (Math.cos(FREQ * t) + (DAMP / FREQ) * Math.sin(FREQ * t))

const PILL_BASE =
  "pointer-events-none overflow-hidden rounded-full bg-background/55 py-0.5 font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-muted backdrop-blur-sm"
const PILL = `${PILL_BASE} px-2` // static labels
// Value pills keep their left padding but cede the right edge to the box, whose
// trailing fade (below) doubles as the right padding.
const PILL_VALUE = `${PILL_BASE} pl-2`

// The box clips/animates its width to the label; a mask fades its trailing edge
// into the pill background over the last FADE_PX, so a label growing or
// shrinking dissolves at the edge instead of meeting a hard clip line. FADE_PX
// is also the box's right padding, so at rest the fade sits over empty space
// and the label itself stays fully crisp. Matches the pills' left padding
// (pl-2 = 8px) so the horizontal padding reads as symmetric.
const FADE_PX = 8
const TRAILING_MASK = `linear-gradient(to right, #000 calc(100% - ${FADE_PX}px), transparent)`

// useLayoutEffect on the client (measure + set width before paint, so the pill
// never flashes at the wrong size), but useEffect on the server to avoid React's
// SSR warning.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect

// How long the pill takes to grow/shrink to a new label's width.
const WIDTH_EASE = "width 0.45s cubic-bezier(0.22, 1, 0.36, 1)"

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

// A label whose characters roll into ("in") or out of ("out") place one after
// another — the same flip-clock cascade the Siri phrases use (keyframes in
// globals.css). Re-key it (`key`) on each hop so the animation restarts. A hop
// renders both at once: the old label rolling out over the new rolling in.
const FlipText = forwardRef<
  HTMLSpanElement,
  { text: string; mode: "in" | "out" | "none"; className?: string }
>(function FlipText({ text, mode, className }, ref) {
  const chars = [...text]
  const letter =
    mode === "in"
      ? "siri-letter siri-letter-in"
      : mode === "out"
        ? "siri-letter siri-letter-collapse"
        : "siri-letter"
  // "in" cascades left-to-right; "out" collapses right-to-left so the trailing
  // edge empties first, ahead of the pill shrinking to the shorter label.
  const delay = (i: number) =>
    mode === "in"
      ? i * CHAR_STAGGER
      : (chars.length - 1 - i) * COLLAPSE_STAGGER
  return (
    <span ref={ref} className={`inline-flex${className ? ` ${className}` : ""}`}>
      {chars.map((ch, i) => (
        <span
          key={i}
          className={letter}
          style={mode === "none" ? undefined : { animationDelay: `${delay(i)}ms` }}
        >
          {ch}
        </span>
      ))}
    </span>
  )
})

// The HUD lines for a given hop: the genre lineage (with its derived score) and
// the destination's detected BPM.
function hudLabels(h: number) {
  const from = NODES[TOUR[h]]
  const to = NODES[TOUR[h + 1]]
  const score = lineageScore(from.genre, to.genre)
  return {
    lineage: `${from.genre} → ${to.genre} · ${score.toFixed(1)}`,
    bpm: `${to.bpm} BPM`,
  }
}

export default function SongConstellation() {
  // `hop` is the transition currently being travelled (from TOUR[hop] to
  // TOUR[hop+1]). It re-renders only the discrete bits — the solidified path
  // edges and the HUD — about once every two seconds; everything that moves
  // each frame is written straight to refs.
  const [hop, setHop] = useState(0)
  const reduced = usePrefersReducedMotion()
  const [rootRef, inView] = useInView<HTMLDivElement>()

  const hopRef = useRef(0)
  const graphRef = useRef<HTMLDivElement>(null)
  const cometRef = useRef<HTMLDivElement>(null)
  const activeEdgeRef = useRef<SVGLineElement>(null)
  const pulseRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([])

  // Each HUD pill clips to a `box` whose width we set to the incoming label's
  // measured width; a CSS width transition then animates the pill open/closed
  // as the content length changes between hops.
  const lineBoxRef = useRef<HTMLSpanElement>(null)
  const lineInRef = useRef<HTMLSpanElement>(null)
  const bpmBoxRef = useRef<HTMLSpanElement>(null)
  const bpmInRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (reduced) return
    if (!inView) return

    // Paint a node's dot at a given lit level (0 = rest). The active
    // destination is tinted with its energy hue and glows; a settled node on
    // the path reads as a plain bright dot.
    const paint = (i: number, level: number, color?: string) => {
      const dot = nodeRefs.current[i]
      if (!dot) return
      dot.style.transform = `scale(${1 + 0.6 * level})`
      if (color) {
        dot.style.background = color
        dot.style.boxShadow = `0 0 ${10 * level}px ${color}`
      } else {
        dot.style.background = `color-mix(in oklab, var(--foreground) ${20 + 40 * level}%, transparent)`
        dot.style.boxShadow = "none"
      }
    }

    const resetNodes = () => {
      for (let i = 0; i < NODES.length; i++) paint(i, 0)
    }

    const start = NODES[TOUR[0]]
    const comet = cometRef.current
    if (comet) {
      comet.style.left = `${start.x}%`
      comet.style.top = `${start.y}%`
      comet.style.opacity = "1"
    }

    let raf = 0
    // The walk breathes: fade the graph in, build the path, fade it out, loop.
    let phase: "in" | "walk" | "fade" = "in"
    let phaseStart = performance.now() // start of the current in/out ramp
    let cycleStart = 0 // start of the current walk transition
    const LAST = TOUR.length - 2 // index of the final transition

    const tick = (now: number) => {
      if (phase === "in") {
        const fe = clamp((now - phaseStart) / FADE, 0, 1)
        if (graphRef.current) graphRef.current.style.opacity = String(fe)
        if (fe >= 1) {
          phase = "walk"
          cycleStart = now
        }
      } else if (phase === "walk") {
        const h = hopRef.current
        const from = NODES[TOUR[h]]
        const to = NODES[TOUR[h + 1]]
        const elapsed = now - cycleStart
        const e = ease(clamp(elapsed / ADVANCE, 0, 1))
        const cx = from.x + (to.x - from.x) * e
        const cy = from.y + (to.y - from.y) * e
        const color = energyColors[to.energy]

        if (comet) {
          comet.style.left = `${cx}%`
          comet.style.top = `${cy}%`
          comet.style.background = color
          comet.style.boxShadow = `0 0 14px ${color}, 0 0 4px ${color}`
        }
        const edge = activeEdgeRef.current
        if (edge) {
          edge.setAttribute("x1", String(from.x))
          edge.setAttribute("y1", String(from.y))
          edge.setAttribute("x2", String(cx))
          edge.setAttribute("y2", String(cy))
          edge.setAttribute("stroke", color)
        }

        // Source settles to a plain bright dot; destination ramps into colour.
        paint(TOUR[h], 1)
        paint(TOUR[h + 1], clamp(e, 0, 1), color)

        // A dot that thumps once per beat at the destination's tempo.
        const pulse = pulseRef.current
        if (pulse) {
          const period = 60000 / to.bpm
          const beat = Math.pow(1 - ((now % period) / period), 2.5)
          pulse.style.transform = `scale(${1 + 0.9 * beat})`
          pulse.style.opacity = String(0.45 + 0.55 * beat)
        }

        if (elapsed >= ADVANCE + HOLD) {
          if (h >= LAST) {
            phase = "fade"
            phaseStart = now
          } else {
            hopRef.current = h + 1
            setHop(h + 1)
            cycleStart = now
          }
        }
      } else {
        const fe = clamp((now - phaseStart) / FADE, 0, 1)
        if (graphRef.current) graphRef.current.style.opacity = String(1 - fe)
        if (fe >= 1) {
          resetNodes()
          if (comet) {
            comet.style.left = `${start.x}%`
            comet.style.top = `${start.y}%`
          }
          // Clear the final hop's coloured edge so it isn't carried into the
          // next cycle's fade-in; the walk phase re-draws it from scratch.
          const edge = activeEdgeRef.current
          if (edge) {
            edge.setAttribute("x1", String(start.x))
            edge.setAttribute("y1", String(start.y))
            edge.setAttribute("x2", String(start.x))
            edge.setAttribute("y2", String(start.y))
            edge.setAttribute("stroke", "transparent")
          }
          hopRef.current = 0
          setHop(0)
          phase = "in"
          phaseStart = now
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced, inView])

  // After each hop, size each pill to its new label so the width transition
  // runs from the old width to the new. Measuring the incoming label (not the
  // wrapper) ignores the outgoing copy that's still rolling out on top of it.
  useIsoLayoutEffect(() => {
    const fit = (
      box: HTMLSpanElement | null,
      incoming: HTMLSpanElement | null
    ) => {
      if (!box || !incoming) return
      // + FADE_PX for the box's right padding (border-box), so the content area
      // still measures exactly to the label and the fade sits beyond it.
      box.style.width = reduced ? "" : `${incoming.offsetWidth + FADE_PX}px`
    }
    fit(lineBoxRef.current, lineInRef.current)
    fit(bpmBoxRef.current, bpmInRef.current)
  }, [hop, reduced])

  // How many transitions are drawn as solid path: everything before the one
  // being travelled (the whole tour when motion is reduced).
  const drawn = reduced ? TOUR.length - 1 : hop
  const cur = reduced ? 4 : hop // a representative hop for the static HUD
  const label = hudLabels(cur)
  // The previous hop's label, rolled out as the current one rolls in. Skipped
  // at the cycle's first hop (the whole graph fades in there instead).
  const showOut = !reduced && cur > 0
  const prev = showOut ? hudLabels(cur - 1) : null
  const walked = new Set(reduced ? TOUR : [])

  return (
    <div
      ref={rootRef}
      className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl inset-ring inset-ring-foreground/10 bg-foreground/[0.03]"
    >
      {/* dot-grid backdrop — reads as the embedding space the nodes live in */}
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

      <div
        ref={graphRef}
        className={`absolute inset-0 ${reduced ? "opacity-100" : "opacity-0"}`}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          {/* the similarity graph */}
          {EDGES.map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={NODES[a].x}
              y1={NODES[a].y}
              x2={NODES[b].x}
              y2={NODES[b].y}
              stroke="currentColor"
              className="text-foreground/10"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {/* the path the walk has solidified so far */}
          {Array.from({ length: drawn }, (_, i) => (
            <line
              key={`p${i}`}
              x1={NODES[TOUR[i]].x}
              y1={NODES[TOUR[i]].y}
              x2={NODES[TOUR[i + 1]].x}
              y2={NODES[TOUR[i + 1]].y}
              stroke="currentColor"
              className="text-foreground/35"
              strokeWidth={1.5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {/* the edge currently being travelled, written each frame */}
          <line
            ref={activeEdgeRef}
            strokeWidth={2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ display: reduced ? "none" : undefined }}
          />
        </svg>

        {/* nodes: outer div positions + centres, inner dot carries the look */}
        {NODES.map((n, i) => (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
          >
            <div
              ref={(el) => {
                nodeRefs.current[i] = el
              }}
              className={`h-2 w-2 backdrop-blur-sm rounded-full will-change-transform ${
                reduced && walked.has(i) ? "bg-foreground/55" : "bg-foreground/20"
              }`}
            />
          </div>
        ))}

        {/* the travelling comet */}
        <div
          ref={cometRef}
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 will-change-transform"
          style={{ display: reduced ? "none" : undefined }}
        />

        {/* labels: what the space is, and what the current hop measured. Inside
            the graph layer so they breathe with the fade in/out at the seam. */}
        <span className={`${PILL} absolute left-4 top-4`}>Sonic signature</span>

        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          <span className={PILL_VALUE}>
            <span
              ref={lineBoxRef}
              className="relative box-border inline-block overflow-hidden align-middle"
              style={{
                paddingRight: FADE_PX,
                maskImage: TRAILING_MASK,
                transition: reduced ? undefined : WIDTH_EASE,
              }}
            >
              {prev && (
                <FlipText
                  key={`go${cur}`}
                  text={prev.lineage}
                  mode="out"
                  className="absolute left-0 top-0"
                />
              )}
              <FlipText
                ref={lineInRef}
                key={`gi${cur}`}
                text={label.lineage}
                mode={reduced ? "none" : "in"}
              />
            </span>
          </span>
          <span className={`${PILL_VALUE} inline-flex items-center gap-1.5`}>
            <span
              ref={pulseRef}
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-current will-change-transform"
            />
            <span
              ref={bpmBoxRef}
              className="relative box-border inline-block overflow-hidden align-middle"
              style={{
                paddingRight: FADE_PX,
                maskImage: TRAILING_MASK,
                transition: reduced ? undefined : WIDTH_EASE,
              }}
            >
              {prev && (
                <FlipText
                  key={`bo${cur}`}
                  text={prev.bpm}
                  mode="out"
                  className="absolute left-0 top-0"
                />
              )}
              <FlipText
                ref={bpmInRef}
                key={`bi${cur}`}
                text={label.bpm}
                mode={reduced ? "none" : "in"}
              />
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
