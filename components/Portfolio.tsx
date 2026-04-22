"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { apps as initialApps } from "@/content/apps";
import { Window } from "./Window";
import { Dock } from "./Dock";
import { ShipLog } from "./ShipLog";
import { StudioTagline } from "./StudioTagline";
import { useStickyDrag } from "@/hooks/useStickyDrag";

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
  const screenWrapRef = useRef<HTMLDivElement | null>(null);
  const menubarRef = useRef<HTMLDivElement | null>(null);

  useStickyDrag(screenWrapRef, menubarRef);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const insideMacApps = useMemo(
    () => initialApps.filter((a) => a.slug !== "terminal"),
    [],
  );
  const terminalApp = useMemo(
    () => initialApps.find((a) => a.slug === "terminal")!,
    [],
  );

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
  const [focusedSlug, setFocusedSlug] = useState<string>("lettermatch");
  const nextZ = useRef<number>(initialApps.length + 1);
  const [relayoutKey, setRelayoutKey] = useState(0);
  // Jitter is rolled once per slug and reused across re-layouts so tuning
  // fractions in the dev panel doesn't cause visible jumpiness.
  const jitterCache = useRef<Record<string, { dx: number; dy: number }>>({});

  // Default zone fractions — used on SSR and when no CSS var is set.
  const ZONE_DEFAULTS: Record<string, { fx: number; fy: number }> = useMemo(
    () => ({
      hirelay:         { fx: 0.12, fy: 0.69 },
      lettermatch:     { fx: 0.95, fy: 0.15 },
      issueaggregator: { fx: 0.76, fy: 0.57 },
      buildmethis:     { fx: 0.32, fy: 0.46 },
    }),
    [],
  );

  useLayoutEffect(() => {
    const desk = desktopRef.current;
    if (!desk) return;
    const rect = desk.getBoundingClientRect();
    const PAD = 16;
    const DOCK_RESERVE = 72;
    const maxX = Math.max(PAD, rect.width - WIN_W - PAD);
    const maxY = Math.max(PAD, rect.height - WIN_H - DOCK_RESERVE);

    const styles = getComputedStyle(document.documentElement);
    const readFrac = (slug: string, axis: "fx" | "fy", fallback: number) => {
      const raw = styles.getPropertyValue(`--lc-card-${slug}-${axis}`).trim();
      const parsed = raw ? parseFloat(raw) : NaN;
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    setWindows((prev) =>
      prev.map((w) => {
        if (w.slug === "terminal") return w;
        const fallback = ZONE_DEFAULTS[w.slug];
        if (!fallback) {
          return {
            ...w,
            x: Math.round(PAD + Math.random() * (maxX - PAD)),
            y: Math.round(PAD + Math.random() * (maxY - PAD)),
          };
        }
        const fx = readFrac(w.slug, "fx", fallback.fx);
        const fy = readFrac(w.slug, "fy", fallback.fy);
        if (!jitterCache.current[w.slug]) {
          jitterCache.current[w.slug] = {
            dx: Math.round((Math.random() - 0.5) * 40),
            dy: Math.round((Math.random() - 0.5) * 30),
          };
        }
        const j = jitterCache.current[w.slug];
        const targetX = Math.round(PAD + (maxX - PAD) * fx) + j.dx;
        const targetY = Math.round(PAD + (maxY - PAD) * fy) + j.dy;
        return {
          ...w,
          x: Math.max(PAD, Math.min(maxX, targetX)),
          y: Math.max(PAD, Math.min(maxY, targetY)),
        };
      }),
    );
  }, [relayoutKey, ZONE_DEFAULTS]);

  useEffect(() => {
    const handler = () => setRelayoutKey((k) => k + 1);
    window.addEventListener("lp:relayout", handler);
    return () => window.removeEventListener("lp:relayout", handler);
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
                x: slug === "terminal" ? x.x : baseX,
                y: slug === "terminal" ? x.y : baseY,
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

  const terminalWin = windows.find((x) => x.slug === "terminal")!;

  return (
    <section
      aria-label="Projects"
      className="relative flex w-full flex-col items-center gap-3 px-5 pb-4 pt-2 sm:px-8 sm:pb-6 sm:pt-3"
    >
      <div className="portfolio-tagline-row">
        <div className="portfolio-tagline-wrap">
          <StudioTagline />
        </div>
      </div>
      <div className="portfolio-row">
        <div ref={screenWrapRef} className="portfolio-screen-wrap mac-screen">
          <div className="mac-display">
            <div ref={menubarRef} className="mac-menubar">
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
              {insideMacApps.map((app) => {
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
                    dimmed={app.comingSoon}
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

        {terminalWin.open && (
          <div className="right-stack">
            <div className="terminal-outside">
              <Window
                app={terminalApp}
                x={0}
                y={0}
                z={1}
                width={terminalApp.width ?? WIN_W}
                height={terminalApp.height ?? WIN_H}
                focused={focusedSlug === "terminal"}
                minimized={false}
                maximized={false}
                sticky
                locked
                desktopRef={desktopRef}
                onFocus={() => focus("terminal")}
                onMove={() => {}}
                onClose={() => {}}
                onMinimize={() => {}}
                onMaximizeToggle={() => {}}
              />
            </div>
            <ShipLog />
          </div>
        )}
      </div>
    </section>
  );
}

export type { WindowState };
