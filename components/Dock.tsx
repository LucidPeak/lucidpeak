"use client";

import type { App } from "@/content/apps";
import type { WindowState } from "./Portfolio";
import { AppMark } from "./AppMark";
import { TerminalMark } from "./TerminalMark";
import { PopTooltip } from "./PopTooltip";
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
  const ulRef = useRef<HTMLUListElement | null>(null);
  const [breath, setBreath] = useState(0);
  const [tooltipSlug, setTooltipSlug] = useState<string | null>(null);

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

  useEffect(() => {
    const handler = () => {
      const term = windows.find((w) => w.slug === "terminal");
      if (term && (term.minimized || !term.open)) {
        setBreath((n) => n + 1);
      }
    };
    window.addEventListener("lp:terminal-success", handler);
    return () => window.removeEventListener("lp:terminal-success", handler);
  }, [windows]);

  useEffect(() => {
    const ul = ulRef.current;
    if (!ul) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const APPROACH = 140;

    let raf = 0;
    let smoothX: number | null = null;
    let weight = 0;
    let targetX: number | null = null;
    let targetWeight = 0;
    let active = false;

    const tick = () => {
      weight += (targetWeight - weight) * 0.14;
      if (Math.abs(targetWeight - weight) < 0.001) weight = targetWeight;
      if (targetX !== null) {
        smoothX =
          smoothX === null ? targetX : smoothX + (targetX - smoothX) * 0.22;
      }

      for (const el of itemRefs.current) {
        if (!el) continue;
        let scale = 1;
        if (smoothX !== null && weight > 0.001) {
          const rect = el.getBoundingClientRect();
          const center = rect.left + rect.width / 2;
          const d = Math.abs(smoothX - center);
          if (d < RANGE) {
            const t = 1 - d / RANGE;
            const eased = Math.cos((1 - t) * Math.PI * 0.5);
            const peak = 1 + (MAX_SCALE - 1) * eased;
            scale = 1 + (peak - 1) * weight;
          }
        }
        if (scale <= 1.0005) {
          el.style.transform = "";
        } else {
          const lift = (scale - 1) * 10;
          el.style.transform = `translateY(${-lift}px) scale(${scale})`;
        }
      }

      if (targetWeight === 0 && weight < 0.001) {
        smoothX = null;
        weight = 0;
        active = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (active) return;
      active = true;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      const rect = ul.getBoundingClientRect();
      const dy = Math.max(
        0,
        rect.top - e.clientY,
        e.clientY - rect.bottom,
      );
      const dx = Math.max(0, rect.left - e.clientX, e.clientX - rect.right);
      const dist = Math.hypot(dx, dy);
      const proximity = Math.max(0, 1 - dist / APPROACH);
      targetX = e.clientX;
      targetWeight = proximity;
      kick();
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <nav aria-label="Projects" className="flex justify-center">
      <ul
        ref={ulRef}
        role="tablist"
        className="dock-list soft-dock flex items-end gap-2.5 rounded-[16px] px-2 py-1.5 sm:gap-3"
      >
        {apps.map((app, idx) => {
          const w = windows.find((x) => x.slug === app.slug);
          const focused = focusedSlug === app.slug && !!w?.open && !w?.minimized;
          const locked = app.comingSoon;
          return (
            <li
              key={app.slug}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              className={`dock-item relative ${locked ? "saturate-[0.6] opacity-60" : ""}`}
            >
              <button
                ref={(el) => {
                  refs.current[app.slug] = el;
                }}
                role="tab"
                aria-selected={focused}
                aria-disabled={locked || undefined}
                aria-label={`${app.name}${locked ? " (coming soon)" : ""}`}
                onClick={(e) => {
                  if (locked) {
                    e.preventDefault();
                    e.stopPropagation();
                    setTooltipSlug((prev) => (prev === app.slug ? null : app.slug));
                    return;
                  }
                  onDockClick(app.slug);
                }}
                className={`group relative flex items-center justify-center rounded-[12px] active:scale-95 ${
                  app.slug === "terminal" && breath > 0 ? "dock-breath" : ""
                }`}
                key={app.slug === "terminal" ? `btn-${breath}` : app.slug}
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
                {locked && (
                  <span aria-hidden className="dock-lock">🔒</span>
                )}
                <span
                  aria-hidden
                  className={`absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full transition-all duration-200 ${
                    focused ? "bg-zinc-900" : "bg-transparent"
                  }`}
                />
              </button>
              {locked && (
                <PopTooltip
                  text={app.comingSoonLabel ?? `${app.name} · coming soon`}
                  open={tooltipSlug === app.slug}
                  onDismiss={() => setTooltipSlug(null)}
                  placement="top"
                  style={{ bottom: "calc(100% + 12px)", left: "50%", transform: "translateX(-50%)" }}
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
