import type { Metadata } from "next";
import HelpTabs from "./HelpTabs";

export const metadata: Metadata = {
  title: "Playback — Help",
  description: "Answers to common questions about Playback on iPhone, iPad, and Mac.",
};

export default function Help() {
  return (
    <main className="mx-auto max-w-xl px-6 py-28 sm:py-32">
      <h1 className="font-display text-3xl font-bold tracking-tight">Help</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted text-pretty">
        Answers to the questions that come up most. Pick your platform, then tap a
        question to expand it.
      </p>

      <HelpTabs />
    </main>
  );
}
