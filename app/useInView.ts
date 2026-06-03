"use client"

import { useEffect, useRef, useState, type RefObject } from "react"

// Tracks whether the referenced element is intersecting the viewport.
//
// Each feature visual drives its own per-frame requestAnimationFrame loop. Left
// unguarded those loops run forever — even while scrolled far off-screen — so on
// mobile several heavy loops share the main thread at once (e.g. the Playlists
// and Design visuals animating while the Songs constellation keeps ticking just
// above), and frames drop. Gating each loop on this hook means only the visuals
// actually on screen animate; the rest idle until they scroll back into view.
//
// `rootMargin` grows the observed region so a loop can spin up just before its
// visual edges into view, avoiding a frozen-then-snap at the boundary.
export function useInView<T extends Element>(
  rootMargin = "200px"
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin])

  return [ref, inView]
}
