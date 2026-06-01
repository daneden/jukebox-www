# Playback marketing site

The one-page marketing site for [Playback](https://daneden.me) — an iOS app that spins your
Apple Music library on a tactile, cover-flow-style dial and resurfaces the songs you'd
forgotten you loved.

Built with Next.js (App Router) and Tailwind CSS v4. Inter for display type, Source Serif
for body copy.

## Develop

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- The App Store link lives in a single `APP_STORE_URL` constant at the top of
  `app/page.tsx` — swap it for the real listing URL once the app is live.
- The Playback logomark is inlined in `app/page.tsx` (and mirrored at `public/playback.svg`
  / `app/icon.svg`); it uses `currentColor`, so it inverts automatically in dark mode.
