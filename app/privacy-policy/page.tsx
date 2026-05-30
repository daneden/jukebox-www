import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playback — Privacy Policy",
  description: "Playback does not collect, distribute, or store any data.",
};

export default function PrivacyPolicy() {
  return (
    <main className="mx-auto max-w-xl px-6 py-28 sm:py-32">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Privacy Policy
      </h1>

      <div className="mt-7 space-y-5 text-lg leading-relaxed text-muted text-pretty">
          <p>
            Playback (also referred to in this policy as &ldquo;the app&rdquo;
            or &ldquo;the service&rdquo;) does not collect, distribute, or store
            any data. It has no accounts, no servers, and no analytics. Your
            music library stays on your device, between you and Apple Music.
          </p>
          <p>
            I may update this Privacy Policy from time to time. You are advised
            to review this page periodically for any changes.
          </p>
          <p>This policy is effective as of 2026-05-30.</p>
          <p>
            If you have any questions or suggestions about this Privacy Policy,
            do not hesitate to contact me at{" "}
            <a
              href="mailto:dan.eden@me.com"
              className="text-foreground underline decoration-hairline underline-offset-4 transition-colors hover:decoration-accent"
            >
              dan.eden@me.com
            </a>
            .
          </p>
      </div>
    </main>
  );
}
