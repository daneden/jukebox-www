import type { Metadata, Viewport } from "next"
import { Inter, Source_Serif_4 } from "next/font/google"
import { APP_STORE_ID } from "./brand"
import "./globals.css"
import SiteFooter from "./SiteFooter"
import SiteHeader from "./SiteHeader"

// `opsz` opts the variable font's optical-sizing axis into the self-hosted
// file (by default next/font only ships `wght`). With the axis present, the
// browser's default `font-optical-sizing: auto` adapts letterforms to the
// rendered size — heavier, more open shapes at small sizes; finer detail large.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  axes: ["opsz"],
})

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  axes: ["opsz"],
})

export const metadata: Metadata = {
  title: "Playback — Rediscover your music",
  description:
    "Find the songs and playlists you once loved but forgot. Discover the songs you never gave a chance. And design new playlists based on your mood.",
  openGraph: {
    title: "Playback — Rediscover your music",
    description:
      "Find the songs and playlists you once loved but forgot. Discover the songs you never gave a chance. And design new playlists based on your mood.",
    type: "website",
  },
  itunes: { appId: APP_STORE_ID },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSerif.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
