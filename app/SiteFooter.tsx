import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-xl px-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-hairline py-10 font-display text-sm text-muted">
        <p>
          Made by{" "}
          <a
            href="https://daneden.me"
            className="text-foreground underline decoration-hairline underline-offset-4 transition-colors hover:decoration-accent"
          >
            Daniel Eden
          </a>
          . Music from Apple Music.
        </p>
        <div className="flex items-center gap-x-6">
          <Link
            href="/help"
            className="text-foreground underline decoration-hairline underline-offset-4 transition-colors hover:decoration-accent"
          >
            Help
          </Link>
          <Link
            href="/privacy-policy"
            className="text-foreground underline decoration-hairline underline-offset-4 transition-colors hover:decoration-accent"
          >
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
