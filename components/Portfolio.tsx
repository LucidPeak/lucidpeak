"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { apps as initialApps } from "@/content/apps";
import { Window } from "./Window";
import { Dock } from "./Dock";

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

export function Portfolio() {
  const desktopRef = useRef<HTMLDivElement | null>(null);
  const [windows, setWindows] = useState<WindowState[]>(() =>
    initialApps.map((a, i) => ({
      slug: a.slug,
      open: true,
      minimized: false,
      maximized: false,
      x: 0,
      y: 0,
      z: initialApps.length - i,
    })),
  );
  const [focusedSlug, setFocusedSlug] = useState<string>(initialApps[0].slug);
  const nextZ = useRef<number>(initialApps.length + 1);
  const positioned = useRef(false);

  useLayoutEffect(() => {
    if (positioned.current) return;
    const desk = desktopRef.current;
    if (!desk) return;
    const rect = desk.getBoundingClientRect();
    const DOCK_RESERVE = 72;
    const PAD = 16;
    const maxX = Math.max(PAD, rect.width - WIN_W - PAD);
    const maxY = Math.max(PAD, rect.height - WIN_H - DOCK_RESERVE);
    const rand = (min: number, max: number) =>
      Math.round(min + Math.random() * Math.max(0, max - min));
    setWindows((prev) =>
      prev.map((w) => {
        if (w.slug === "terminal") {
          return { ...w, x: 24, y: 28, z: 0 };
        }
        // Project windows live on the right half so the pinned terminal
        // on the left stays unobstructed on first paint.
        const rightMinX = Math.max(PAD, Math.floor(rect.width / 2));
        const rightMaxX = Math.max(rightMinX, maxX);
        return {
          ...w,
          x: rand(rightMinX, rightMaxX),
          y: rand(PAD, maxY),
        };
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
      const desk = desktopRef.current;
      const rect = desk?.getBoundingClientRect();
      const baseX = rect ? Math.max(20, rect.width / 2 - WIN_W / 2) : 80;
      const baseY = rect
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
                x: baseX,
                y: baseY,
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
            className="mac-desktop relative w-full overflow-hidden"
            style={{ height: "min(66vh, 600px)", minHeight: 440 }}
          >
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
