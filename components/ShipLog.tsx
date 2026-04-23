"use client";

import { useRef } from "react";
import { shipLog } from "@/content/shipLog";
import { apps } from "@/content/apps";
import { useStickyDrag } from "@/hooks/useStickyDrag";

const appBySlug = new Map(apps.map((a) => [a.slug, a]));

export function ShipLog() {
  const chromeRef = useRef<HTMLDivElement | null>(null);
  const titlebarRef = useRef<HTMLDivElement | null>(null);
  useStickyDrag(chromeRef, titlebarRef);

  const entries = shipLog.slice(0, 5);
  return (
    <div className="shiplog-outside" aria-label="Ship log">
      <div ref={chromeRef} className="win-chrome">
        <div className="relative z-[1] flex h-full flex-col overflow-hidden rounded-[22px] soft-card">
          <div
            ref={titlebarRef}
            className="win-titlebar relative flex h-9 shrink-0 items-center px-3 select-none"
          >
            <div className="traffic-lights flex items-center gap-[8px]">
              <span className="traffic-dot traffic-close" aria-hidden />
              <span className="traffic-dot traffic-min" aria-hidden />
              <span className="traffic-dot traffic-max" aria-hidden />
            </div>
            <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[12px] font-medium text-zinc-500">
              Ship log
            </span>
          </div>
          <ul className="shiplog-body">
            {entries.map((entry, i) => {
              const app = entry.slug ? appBySlug.get(entry.slug) : undefined;
              return (
                <li key={i} className="shiplog-row">
                  <span className="shiplog-date">{entry.date}</span>
                  <span className="shiplog-title">{entry.title}</span>
                  {app && (app.href ? (
                    <a
                      href={app.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shiplog-mark shiplog-mark-link"
                      style={
                        {
                          "--mark-accent": app.accent,
                        } as React.CSSProperties
                      }
                      aria-label={`open ${app.name}`}
                      title={app.name}
                    >
                      {app.Icon && (
                        <span className="shiplog-mark-icon" aria-hidden>
                          <app.Icon size={14} />
                        </span>
                      )}
                      <span className="shiplog-mark-name">{app.name}</span>
                    </a>
                  ) : (
                    <span
                      className="shiplog-mark"
                      style={
                        {
                          "--mark-accent": app.accent,
                        } as React.CSSProperties
                      }
                      aria-label={`shipped in ${app.name}`}
                      title={app.name}
                    >
                      {app.Icon && (
                        <span className="shiplog-mark-icon" aria-hidden>
                          <app.Icon size={14} />
                        </span>
                      )}
                      <span className="shiplog-mark-name">{app.name}</span>
                    </span>
                  ))}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
