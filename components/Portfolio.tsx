"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { apps as initialApps } from "@/content/apps";
import { Window } from "./Window";
import { Dock } from "./Dock";
import { LeftRail } from "./LeftRail";

type WindowState = {
  slug: string;
  open: boolean;
  minimized: boolean;
  maximized: boolean;
  x: number;
  y: number;
  prev?: { x: number; y: number };
  z: number;
};

const WIN_W = 270;
const WIN_H = 240;

const TERMINAL_X = 76;
const TERMINAL_Y = 28;

const LETTERMATCH_RIGHT_MARGIN = 40;
const LETTERMATCH_Y = 40;

const DRAG_MIN_X = 76;

export function Portfolio() {
  const desktopRef = useRef<HTMLDivElement | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const comingSoonApps = useMemo(
    () => initialApps.filter((a) => a.comingSoon),
    [],
  );

  const [windows, setWindows] = useState<WindowState[]>(() =>
    initialApps.map((a, i) => ({
      slug: a.slug,
      open: !a.comingSoon,
      minimized: false,
      maximized: false,
      x: 0,
      y: 0,
      z: initialApps.length - i,
    })),
  );
  const [focusedSlug, setFocusedSlug] = useState<string>("lettermatch");
  const nextZ = useRef<number>(initialApps.length + 1);
  const initialPositions = useRef<Record<string, { x: number; y: number }>>({});
  const positioned = useRef(false);

  useLayoutEffect(() => {
    if (positioned.current) return;
    const desk = desktopRef.current;
    if (!desk) return;
    const rect = desk.getBoundingClientRect();

    const lettermatchX = Math.max(
      DRAG_MIN_X + TERMINAL_X,
      rect.width - WIN_W - LETTERMATCH_RIGHT_MARGIN,
    );

    initialPositions.current = {
      terminal: { x: TERMINAL_X, y: TERMINAL_Y },
      lettermatch: { x: lettermatchX, y: LETTERMATCH_Y },
    };

    setWindows((prev) =>
      prev.map((w) => {
        const pos = initialPositions.current[w.slug];
        if (pos) return { ...w, x: pos.x, y: pos.y };
        return w;
      }),
    );
    positioned.current = true;
  }, []);

  const focus = (slug: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.slug === slug ? { ...w, z: nextZ.current++ } : w)),
    );
    setFocusedSlug(slug);
  };

  const move = (slug: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.slug === slug ? { ...w, x, y } : w)));
  };

  const close = (slug: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.slug === slug ? { ...w, open: false, minimized: false, maximized: false } : w,
      ),
    );
    if (focusedSlug === slug) {
      const next = [...windows]
        .filter((w) => w.slug !== slug && w.open && !w.minimized)
        .sort((a, b) => b.z - a.z)[0];
      setFocusedSlug(next ? next.slug : "");
    }
  };

  const minimize = (slug: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.slug === slug ? { ...w, minimized: true } : w)),
    );
    if (focusedSlug === slug) {
      const next = [...windows]
        .filter((w) => w.slug !== slug && w.open && !w.minimized)
        .sort((a, b) => b.z - a.z)[0];
      setFocusedSlug(next ? next.slug : "");
    }
  };

  const maximizeToggle = (slug: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.slug !== slug) return w;
        if (w.maximized) {
          return {
            ...w,
            maximized: false,
            x: w.prev?.x ?? w.x,
            y: w.prev?.y ?? w.y,
            prev: undefined,
            z: nextZ.current++,
          };
        }
        return {
          ...w,
          maximized: true,
          prev: { x: w.x, y: w.y },
          z: nextZ.current++,
        };
      }),
    );
    setFocusedSlug(slug);
  };

  const openOrFocus = (slug: string) => {
    const w = windows.find((x) => x.slug === slug);
    if (!w) return;
    if (!w.open) {
      const pos = initialPositions.current[slug];
      const desk = desktopRef.current;
      const rect = desk?.getBoundingClientRect();
      const fallbackX = rect ? Math.max(DRAG_MIN_X, rect.width / 2 - WIN_W / 2) : 80;
      const fallbackY = rect
        ? Math.max(20, Math.min(rect.height / 2 - WIN_H / 2, rect.height - WIN_H - 72))
        : 60;
      setWindows((prev) =>
        prev.map((x) =>
          x.slug === slug
            ? {
                ...x,
                open: true,
                minimized: false,
                maximized: false,
                x: pos?.x ?? fallbackX,
                y: pos?.y ?? fallbackY,
                z: nextZ.current++,
              }
            : x,
        ),
      );
      setFocusedSlug(slug);
      return;
    }
    if (w.minimized) {
      setWindows((prev) =>
        prev.map((x) =>
          x.slug === slug ? { ...x, minimized: false, z: nextZ.current++ } : x,
        ),
      );
      setFocusedSlug(slug);
      return;
    }
    if (focusedSlug === slug) {
      minimize(slug);
      return;
    }
    focus(slug);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const active = windows.filter((w) => w.open && !w.minimized);
      if (active.length === 0) return;
      const idx = active.findIndex((w) => w.slug === focusedSlug);
      const nextIdx =
        e.key === "ArrowRight"
          ? (idx + 1) % active.length
          : (idx - 1 + active.length) % active.length;
      focus(active[nextIdx === -1 ? 0 : nextIdx].slug);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [windows, focusedSlug]);

  return (
    <section
      aria-label="Projects"
      className="flex w-full flex-col items-center gap-4 py-4 sm:py-6"
    >
      <div className="mac-screen w-full">
        <div className="mac-display">
          <div className="mac-menubar">
            <span className="mac-menubar-dot" aria-hidden />
            <span className="mac-menubar-label">lucidpeak</span>
          </div>
          <div
            ref={desktopRef}
            className={`mac-desktop relative w-full overflow-hidden ${isMobile ? "is-stacked" : ""}`}
            style={
              isMobile
                ? undefined
                : { height: "min(66vh, 600px)", minHeight: 440 }
            }
          >
            {!isMobile && <LeftRail apps={comingSoonApps} />}

            {initialApps.map((app) => {
              const w = windows.find((x) => x.slug === app.slug)!;
              if (!w.open) return null;
              return (
                <Window
                  key={app.slug}
                  app={app}
                  x={w.x}
                  y={w.y}
                  z={w.z}
                  width={app.width ?? WIN_W}
                  height={app.height ?? WIN_H}
                  focused={focusedSlug === app.slug}
                  minimized={w.minimized}
                  maximized={w.maximized}
                  stacked={isMobile}
                  desktopRef={desktopRef}
                  onFocus={() => focus(app.slug)}
                  onMove={(x, y) => move(app.slug, x, y)}
                  onClose={() => close(app.slug)}
                  onMinimize={() => minimize(app.slug)}
                  onMaximizeToggle={() => maximizeToggle(app.slug)}
                />
              );
            })}

            <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[9999] flex justify-center">
              <div className="pointer-events-auto">
                <Dock
                  apps={initialApps}
                  windows={windows}
                  focusedSlug={focusedSlug}
                  onDockClick={openOrFocus}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export type { WindowState };
