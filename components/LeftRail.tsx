"use client";

import { useState } from "react";
import type { App } from "@/content/apps";
import { AppMark } from "./AppMark";
import { PopTooltip } from "./PopTooltip";

type Props = {
  apps: App[];
};

export function LeftRail({ apps }: Props) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  return (
    <nav aria-label="Coming soon" className="left-rail">
      {apps.map((app) => (
        <div key={app.slug} style={{ position: "relative" }}>
          <button
            type="button"
            aria-label={`${app.name}, coming soon`}
            aria-describedby={openSlug === app.slug ? `rail-tip-${app.slug}` : undefined}
            onClick={(e) => {
              e.stopPropagation();
              setOpenSlug((prev) => (prev === app.slug ? null : app.slug));
            }}
            className="rail-thumb"
          >
            <AppMark app={app} size={30} />
          </button>
          <PopTooltip
            text={app.comingSoonLabel ?? `${app.name} · coming soon`}
            open={openSlug === app.slug}
            onDismiss={() => setOpenSlug(null)}
            placement="right"
            style={{ left: "calc(100% + 10px)", top: "50%", transform: "translateY(-50%)" }}
          />
        </div>
      ))}
    </nav>
  );
}
