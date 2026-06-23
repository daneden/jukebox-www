import EnergyCurve from "./EnergyCurve"
import SiriPhrases from "./SiriPhrases"
import SongCarousel from "./SongCarousel"
import SongConstellation from "./SongConstellation"
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
    <section className="py-10 sm:py-14">
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
      <section className="flex min-h-[80svh] flex-col justify-center py-10">
        <div
          className="relative animate-[rise_0.7s_cubic-bezier(0.22,1,0.36,1)_both]"
          style={{ animationDelay: "0.05s" }}
        >
          <Logomark className="h-16 w-auto" />
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
          Rediscover your music.
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

      <Feature title="Songs" visual={<SongConstellation />}>
        <p>
          An endless rotation drawn from your own library. A bespoke algorithm
          blends genre lineage, song tempo, and sonic similarity to build a
          queue that prioritises the songs you&rsquo;ve played most and those
          that have been in your library longest.
        </p>

        <p>
          The result is a unique playback queue that feels curated, built from
          the songs you already care about.
        </p>

        <p>
          Every played queue is saved to Playback&rsquo;s History, so you can
          save the playlists you love.
        </p>
      </Feature>

      <Feature title="Playlists" visual={<SongCarousel />}>
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

      <Feature title="Just ask" visual={<SiriPhrases />}>
        <p>
          Every mode answers to your voice. Ask Siri to make a playlist, design
          one by mood, play something at random, or save what&rsquo;s playing to
          your library &mdash; and tap a Control Center button to start the
          music without unlocking your phone.
        </p>
        <p>
          It all runs on Shortcuts, so you can wire Playback into routines of
          your own.
        </p>
      </Feature>
    </main>
  )
}
