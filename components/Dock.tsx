"use client";

import type { App } from "@/content/apps";
import type { WindowState } from "./Portfolio";
import { AppMark } from "./AppMark";
import { TerminalMark } from "./TerminalMark";
import { useEffect, useRef, useState } from "react";

type Props = {
  apps: App[];
  windows: WindowState[];
  focusedSlug: string;
  onDockClick: (slug: string) => void;
};

const MAX_SCALE = 1.2;
const RANGE = 90;

export function Dock({ apps, windows, focusedSlug, onDockClick }: Props) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [cursorX, setCursorX] = useState<number | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const el = document.activeElement;
      if (!el || !(el instanceof HTMLButtonElement)) return;
      const slug = Object.entries(refs.current).find(
        ([, ref]) => ref === el,
      )?.[0];
      if (slug) {
        e.preventDefault();
        onDockClick(slug);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onDockClick]);

  const scaleFor = (idx: number) => {
    if (cursorX === null) return 1;
    const el = itemRefs.current[idx];
    if (!el) return 1;
    const rect = el.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const d = Math.abs(cursorX - center);
    if (d >= RANGE) return 1;
    const t = 1 - d / RANGE;
    const eased = Math.cos((1 - t) * Math.PI * 0.5);
    return 1 + (MAX_SCALE - 1) * eased;
  };

  return (
    <nav
      aria-label="Projects"
      className="flex justify-center"
    >
      <ul
        role="tablist"
        onMouseMove={(e) => setCursorX(e.clientX)}
        onMouseLeave={() => setCursorX(null)}
        className="dock-list soft-dock flex items-end gap-2.5 rounded-[16px] px-2 py-1.5 sm:gap-3"
      >
        {apps.map((app, idx) => {
          const w = windows.find((x) => x.slug === app.slug);
          const focused = focusedSlug === app.slug && !!w?.open && !w?.minimized;
          const scale = scaleFor(idx);
          const lift = (scale - 1) * 10;
          return (
            <li
              key={app.slug}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              className={`dock-item relative ${app.comingSoon ? "saturate-[0.8] opacity-85" : ""}`}
              style={{
                transform: `translateY(${-lift}px) scale(${scale})`,
              }}
            >
              <button
                ref={(el) => {
                  refs.current[app.slug] = el;
                }}
                role="tab"
                aria-selected={focused}
                aria-label={`${app.name}${app.comingSoon ? " (coming soon)" : ""}`}
                onClick={() => onDockClick(app.slug)}
                className="group relative flex items-center justify-center rounded-[12px] active:scale-95"
              >
                {app.slug === "terminal" ? (
                  <TerminalMark
                    size={32}
                    accent={app.accent}
                    className="transition-[filter] duration-200 group-hover:brightness-105"
                  />
                ) : (
                  <AppMark
                    app={app}
                    size={32}
                    className="transition-[filter] duration-200 group-hover:brightness-105"
                  />
                )}
                <span
                  aria-hidden
                  className={`absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full transition-all duration-200 ${
                    focused ? "bg-zinc-900" : "bg-transparent"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
