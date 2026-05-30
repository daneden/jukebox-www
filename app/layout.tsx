import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Playback — Rediscover your music library",
  description:
    "Playback spins your Apple Music library on a tactile cover-flow dial and resurfaces the songs you'd forgotten you loved.",
  openGraph: {
    title: "Playback — Rediscover your music library",
    description:
      "Playback spins your Apple Music library on a tactile cover-flow dial and resurfaces the songs you'd forgotten you loved.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSerif.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
