"use client";

import { useEffect, useState } from "react";
import { APP_STORE_URL, AppleLogo, Logomark } from "./brand";

export default function SiteHeader() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Reveal once the hero (≈ first viewport) has scrolled away.
    const threshold = () => window.innerHeight * 0.6;

    let ticking = false;
    const update = () => {
      setShown(window.scrollY > threshold());
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      inert={!shown}
      aria-hidden={!shown}
      className={`fixed inset-x-0 top-0 z-50 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        shown
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto max-w-xl px-6 pt-3">
        <div className="flex items-center justify-between gap-3 rounded-full border border-hairline bg-background/70 py-2 pl-4 pr-2 shadow-lg shadow-black/5 backdrop-blur-md">
          <a
            href="#top"
            className="flex items-center gap-2 transition-opacity hover:opacity-70"
          >
            <Logomark className="h-6 w-auto" />
            <span className="font-display text-base font-bold tracking-tight">
              Playback
            </span>
          </a>
          <a
            href={APP_STORE_URL}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 font-display text-sm font-medium text-background transition-colors hover:bg-accent"
          >
            <AppleLogo className="h-[1em] w-auto" />
            Download
          </a>
        </div>
      </div>
    </header>
  );
}
