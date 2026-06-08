"use client";

import { useState } from "react";
import IphoneHelp from "@/content/help-iphone.mdx";
import MacHelp from "@/content/help-mac.mdx";

const TABS = [
  { id: "iphone", label: "iPhone & iPad" },
  { id: "mac", label: "Mac" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function HelpTabs() {
  const [active, setActive] = useState<TabId>("iphone");
  const activeIndex = TABS.findIndex((t) => t.id === active);

  return (
    <div className="mt-8">
      <div
        role="tablist"
        aria-label="Choose your platform"
        className="relative grid grid-cols-2 rounded-full border border-hairline bg-foreground/[0.03] p-1 font-display text-sm font-medium"
      >
        {/* Sliding pill behind the active segment. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-background shadow-sm shadow-black/5 ring-1 ring-hairline transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={`relative z-10 rounded-full py-2 text-center transition-colors ${
              active === tab.id
                ? "text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id="panel-iphone"
        aria-labelledby="tab-iphone"
        hidden={active !== "iphone"}
        className="mt-6"
      >
        <IphoneHelp />
      </div>
      <div
        role="tabpanel"
        id="panel-mac"
        aria-labelledby="tab-mac"
        hidden={active !== "mac"}
        className="mt-6"
      >
        <MacHelp />
      </div>
    </div>
  );
}
