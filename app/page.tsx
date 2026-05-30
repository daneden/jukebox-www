import EnergyCurve from "./EnergyCurve"
import { APP_STORE_URL, AppleLogo, Logomark } from "./brand"

function Feature({
  title,
  children,
  visual,
}: {
  title: string
  children: React.ReactNode
  visual?: React.ReactNode
}) {
  return (
    <section className="border-t border-hairline py-14 sm:py-20">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-lg leading-relaxed text-muted text-pretty">
        {children}
      </div>
      {visual && <div className="mt-9">{visual}</div>}
    </section>
  )
}

export default function Home() {
  return (
    <main className="mx-auto max-w-xl px-6">
      <section className="flex min-h-[88svh] flex-col justify-center py-20">
        <div
          className="relative animate-[rise_0.7s_cubic-bezier(0.22,1,0.36,1)_both]"
          style={{ animationDelay: "0.05s" }}
        >
          <Logomark className="h-22 w-auto" />
        </div>

        <h1
          className="mt-2 font-display text-3xl font-bold tracking-tight animate-[rise_0.7s_cubic-bezier(0.22,1,0.36,1)_both]"
          style={{ animationDelay: "0.12s" }}
        >
          Playback
        </h1>

        <p
          className="mt-0 font-display text-3xl leading-tight tracking-tight text-muted text-balance animate-[rise_0.7s_cubic-bezier(0.22,1,0.36,1)_both]"
          style={{ animationDelay: "0.18s" }}
        >
          Rediscover your music library.
        </p>

        <div
          className="mt-7 space-y-5 text-lg text-muted leading-relaxed text-pretty animate-[rise_0.7s_cubic-bezier(0.22,1,0.36,1)_both]"
          style={{ animationDelay: "0.26s" }}
        >
          <p>
            Spin through your Apple Music library to surface the playlists and
            songs you&rsquo;d forgotten.
          </p>
          <p>Generate new playlists based on sonic similarity.</p>
          <p>No accounts, no tracking, and no subscription.</p>
        </div>

        <a
          href={APP_STORE_URL}
          className="group mt-10 inline-flex self-start items-center gap-2.5 rounded-full bg-foreground px-6 py-3.5 font-display text-base font-medium text-background shadow-lg shadow-black/10 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-accent animate-[rise_0.7s_cubic-bezier(0.22,1,0.36,1)_both]"
          style={{ animationDelay: "0.34s" }}
        >
          <AppleLogo className="h-[1.05em] w-auto" />
          Download on the App Store
        </a>
      </section>

      <Feature title="Songs">
        <p>
          An endless rotation drawn from your own library. A bespoke algorithm
          walks from one track to the next, weighing similarity, energy, and how
          long it&rsquo;s been since you last listened.
        </p>
      </Feature>

      <Feature title="Playlists">
        <p>
          You&rsquo;ve got good taste: Playback brings it to the fore. The
          Playlists tab spins a dial through your Apple Music playlists and
          lands on one at random. Your collection, reshuffled, with none of the
          deciding.
        </p>
      </Feature>

      <Feature title="Design" visual={<EnergyCurve />}>
        <p>
          Build a playlist by drawing its shape. Sketch an energy curve &mdash;
          from glacial calm up to full intensity &mdash; and Playback fills it
          with songs that rise and fall to match. Curate playlists to suit your
          mood.
        </p>
      </Feature>
    </main>
  )
}
