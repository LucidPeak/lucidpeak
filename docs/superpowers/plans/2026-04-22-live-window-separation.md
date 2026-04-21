# Live Window Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the randomized-windows layout with a Stage Manager metaphor — live apps (Terminal, Lettermatch) staged deterministically, coming-soon apps collapse to a tooltip-only left rail, coming-soon dock icons get locked, and mobile falls back to a vertical stack.

**Architecture:** Two new components (`LeftRail`, `PopTooltip`), three modified components (`Portfolio`, `Dock`, `Window`), and one modified stylesheet (`app/globals.css`). No framework or dependency changes. No state-shape change beyond `open: false` for coming-soon apps on initial mount.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind v4. No test runner in project; verification is manual via `npm run dev` in a browser.

---

## Notes for the executing engineer

- **This is Next.js 16 + React 19.** Project has deprecation notices in `AGENTS.md`. Don't assume pre-16 Next.js APIs. Existing `"use client"` directives tell you which components are client-side.
- **No test runner.** Verification steps say "open http://localhost:3000 and check X". Trust your eyes. Take the time to actually click through each case.
- **Tailwind v4 + hand-written CSS** both in play. Existing convention: structural/animation CSS in `app/globals.css`, layout classes via Tailwind utilities on JSX. Follow that.
- **Commit after each task.** No squashing between tasks. Commit messages follow `fix(x):` / `feat(x):` conventions visible in recent `git log`.
- **The dev server:** run `npm run dev` once and leave it running across tasks. Next's hot reload handles file changes. Watch the terminal for compile errors.
- **Reduced motion:** the project already respects `prefers-reduced-motion: reduce` for some animations. Any new animation you add must gate behind that media query block (see `globals.css` line 401+).

---

## File Structure

**Create:**
- `components/LeftRail.tsx` — renders coming-soon thumbnails on the left edge of `.mac-desktop`. Desktop only.
- `components/PopTooltip.tsx` — controlled tooltip primitive. Consumed by `LeftRail` and `Dock`.

**Modify:**
- `components/Portfolio.tsx` — deterministic initial positions, `open: false` for coming-soon, render `<LeftRail>`, mobile-stack fallback.
- `components/Dock.tsx` — lock glyph on coming-soon icons, click-short-circuit to `PopTooltip` instead of `onDockClick`.
- `components/Window.tsx` — support a `stacked` prop for mobile (relative layout, no drag, no z-index).
- `content/apps.ts` — add optional `comingSoonLabel?: string` field, populate for I/R/B.
- `app/globals.css` — rail/thumbnail/tooltip/lock/mobile-stack styles.

---

## Task 1: Add CSS primitives

**Files:**
- Modify: `app/globals.css` (append at end of file)

- [ ] **Step 1: Add rail, thumbnail, tooltip, lock, mobile-stack styles**

Append this block to the end of `app/globals.css`:

```css
/* === Left Rail (coming-soon thumbnails, desktop only) === */
.left-rail {
  position: absolute;
  left: 14px;
  top: 20px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}
.left-rail > * { pointer-events: auto; }

.rail-thumb {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 11px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 160ms cubic-bezier(0.22, 1, 0.36, 1),
              border-color 160ms ease;
}
.rail-thumb:hover {
  transform: scale(1.06);
  border-color: rgba(201, 167, 106, 0.9);
}
.rail-thumb:focus-visible {
  outline: 2px solid rgba(201, 167, 106, 0.9);
  outline-offset: 2px;
}

/* Hide rail on mobile */
@media (max-width: 767px) {
  .left-rail { display: none; }
}

/* === PopTooltip === */
.pop-tooltip {
  position: absolute;
  z-index: 10000;
  background: #1a1614;
  color: #f5ede0;
  border: 1px solid rgba(201, 167, 106, 0.9);
  padding: 5px 9px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.01em;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  animation: pop-tooltip-in 120ms cubic-bezier(0.22, 1, 0.36, 1) both;
  pointer-events: none;
}
.pop-tooltip::after {
  content: "";
  position: absolute;
  border: 5px solid transparent;
}
.pop-tooltip[data-placement="right"]::after {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-right-color: rgba(201, 167, 106, 0.9);
}
.pop-tooltip[data-placement="top"]::after {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-top-color: rgba(201, 167, 106, 0.9);
}
@keyframes pop-tooltip-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .pop-tooltip { animation: none; }
}

/* === Dock lock overlay (coming-soon icons) === */
.dock-lock {
  position: absolute;
  bottom: -3px;
  right: -3px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #1a1614;
  color: #f5ede0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  line-height: 1;
  box-shadow: 0 0 0 1.5px #eceae4;
  pointer-events: none;
}

/* === Mobile stack layout for mac-desktop === */
@media (max-width: 767px) {
  .mac-desktop.is-stacked {
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 14px 14px 80px 14px;
  }
  .mac-desktop.is-stacked .win-chrome {
    position: relative !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: auto !important;
    transform: none !important;
    z-index: auto !important;
    min-height: 240px;
  }
}
```

- [ ] **Step 2: Verify CSS compiles**

Run: `npm run dev`
Expected: Next dev server boots clean. Open http://localhost:3000 — no visual regression yet (nothing references the new classes).

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(portfolio): add rail, tooltip, lock, mobile-stack CSS primitives"
```

---

## Task 2: PopTooltip primitive

**Files:**
- Create: `components/PopTooltip.tsx`

- [ ] **Step 1: Create the component**

Write `components/PopTooltip.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";

type Placement = "right" | "top";

type Props = {
  text: string;
  open: boolean;
  onDismiss: () => void;
  placement?: Placement;
  autoDismissMs?: number;
  style?: React.CSSProperties;
};

export function PopTooltip({
  text,
  open,
  onDismiss,
  placement = "top",
  autoDismissMs = 3000,
  style,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(onDismiss, autoDismissMs);
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      onDismiss();
    };
    window.addEventListener("mousedown", onDoc);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("mousedown", onDoc);
    };
  }, [open, onDismiss, autoDismissMs]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      role="tooltip"
      className="pop-tooltip"
      data-placement={placement}
      style={style}
    >
      {text}
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

The dev server should hot-reload. Open the Next terminal output. Expected: no TypeScript errors. Nothing visible yet (component unused).

- [ ] **Step 3: Commit**

```bash
git add components/PopTooltip.tsx
git commit -m "feat(portfolio): add PopTooltip primitive"
```

---

## Task 3: Add `comingSoonLabel` to apps.ts

**Files:**
- Modify: `content/apps.ts`

- [ ] **Step 1: Update the App type and fill labels**

Replace the current `App` type and entries in `content/apps.ts` with:

```ts
import type { FC } from "react";
import { LettermatchIcon } from "@/components/app-icons/LettermatchIcon";
import { IssueAggregatorIcon } from "@/components/app-icons/IssueAggregatorIcon";
import { HiRelayIcon } from "@/components/app-icons/HiRelayIcon";
import { BuildMeThisIcon } from "@/components/app-icons/BuildMeThisIcon";

export type AppIcon = FC<{ size: number }>;

export type App = {
  slug: string;
  name: string;
  pitch?: string;
  tagline?: string;
  href?: string;
  comingSoon: boolean;
  comingSoonLabel?: string;
  accent: string;
  mark: string;
  Icon?: AppIcon;
  width?: number;
  height?: number;
};

export const apps: App[] = [
  {
    slug: "lettermatch",
    name: "Lettermatch",
    pitch: "Compare Letterboxd and MAL watchlists to find your shared taste.",
    tagline: "What should we watch? Decide in 30 seconds.",
    href: "https://lettermatch.app",
    comingSoon: false,
    accent: "#e5a853",
    mark: "L",
    Icon: LettermatchIcon,
  },
  {
    slug: "issueaggregator",
    name: "IssueAggregator",
    pitch: "A unified board of open-source issues and bounties across GitHub.",
    href: "https://github.com/teodor-i/IssueAggregator",
    comingSoon: true,
    comingSoonLabel: "IssueAggregator · launching Q3",
    accent: "#7c8ef0",
    mark: "I",
    Icon: IssueAggregatorIcon,
  },
  {
    slug: "hirelay",
    name: "hiRelay",
    pitch: "Content OS for solo creators — one idea, five platform-native outputs, your voice.",
    comingSoon: true,
    comingSoonLabel: "hiRelay · launching Q3",
    accent: "#5ed4b3",
    mark: "R",
    Icon: HiRelayIcon,
  },
  {
    slug: "buildmethis",
    name: "BuildMeThis",
    pitch: "A community board where people post problems and builders ship solutions.",
    tagline: "Wishes meet builders.",
    comingSoon: true,
    comingSoonLabel: "BuildMeThis · launching Q4",
    accent: "#ef6f8c",
    mark: "B",
    Icon: BuildMeThisIcon,
  },
  {
    slug: "terminal",
    name: "Terminal – Signup",
    comingSoon: false,
    accent: "#1c1b19",
    mark: "›",
    width: 280,
    height: 380,
  },
];
```

- [ ] **Step 2: Verify compile**

Next hot-reloads. Expected: no TS errors. Page still renders as before.

- [ ] **Step 3: Commit**

```bash
git add content/apps.ts
git commit -m "feat(portfolio): add comingSoonLabel to coming-soon apps"
```

---

## Task 4: LeftRail component

**Files:**
- Create: `components/LeftRail.tsx`

- [ ] **Step 1: Create the rail**

Write `components/LeftRail.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify compile**

Expected: no TS errors. Rail unused; still invisible on the page.

- [ ] **Step 3: Commit**

```bash
git add components/LeftRail.tsx
git commit -m "feat(portfolio): add LeftRail with tooltip-only thumbnails"
```

---

## Task 5: Dock locked-icon tooltip

**Files:**
- Modify: `components/Dock.tsx`

- [ ] **Step 1: Replace the component with locked-icon support**

In `components/Dock.tsx`, make four changes:

(a) Add imports at top:

```tsx
import { PopTooltip } from "./PopTooltip";
```

(b) Inside the component body, add state near the existing `useState`:

```tsx
const [tooltipSlug, setTooltipSlug] = useState<string | null>(null);
```

(c) Replace the `<button>` rendering inside the `.map(...)` with the version below. The key change: coming-soon apps short-circuit and open a tooltip; live apps call `onDockClick`. A `🔒` overlay is appended to coming-soon icons.

Full replacement for the `apps.map((app, idx) => {...})` block:

```tsx
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
```

(d) Remove the `useState` import scope confusion — `useState` is already imported at the top; don't re-import.

- [ ] **Step 2: Verify in browser**

Open http://localhost:3000. Hover the dock. Expected:
- Terminal + Lettermatch icons look normal, click opens/focuses their windows (same as today).
- IssueAggregator, hiRelay, BuildMeThis icons are dimmed with a 🔒 badge bottom-right.
- Clicking a locked icon does NOT open its window. Instead a dark tooltip pops above the icon (e.g. "IssueAggregator · launching Q3"). Clicking outside dismisses; clicking the same icon again dismisses.

- [ ] **Step 3: Commit**

```bash
git add components/Dock.tsx
git commit -m "feat(dock): lock coming-soon icons, show tooltip on click"
```

---

## Task 6: Window `stacked` prop

**Files:**
- Modify: `components/Window.tsx`

- [ ] **Step 1: Add `stacked` prop and short-circuit positioning**

In `components/Window.tsx`:

(a) Add to `Props` type:

```tsx
stacked?: boolean;
```

(b) In the destructured component signature, add `stacked = false,`.

(c) Replace the `style` computation with:

```tsx
const style: React.CSSProperties = stacked
  ? {} // mobile stack: CSS media query + .is-stacked class drive layout
  : maximized
    ? {
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        zIndex: z,
        transition: "all 220ms cubic-bezier(0.22,1,0.36,1)",
      }
    : {
        left: x,
        top: y,
        width,
        height,
        zIndex: z,
        transform: minimized
          ? "translateY(60px) scale(0.7)"
          : "translateY(0) scale(1)",
        opacity: minimized ? 0 : 1,
        pointerEvents: minimized ? "none" : "auto",
        transition:
          "transform 260ms cubic-bezier(0.22,1,0.36,1), opacity 220ms ease",
      };
```

(d) Replace the `handleTitlePointerDown` handler to noop when `stacked`:

```tsx
const handleTitlePointerDown = (e: React.PointerEvent) => {
  if (stacked) return;
  if (maximized) return;
  onFocus();
  const target = e.currentTarget as HTMLDivElement;
  target.setPointerCapture(e.pointerId);
  dragState.current = { dx: e.clientX - x, dy: e.clientY - y };
  // ... rest of existing handler unchanged
```

(leave the rest of the drag handler body exactly as it is today)

- [ ] **Step 2: Verify nothing broke**

Reload http://localhost:3000. Expected: desktop layout unchanged — windows still positioned via inline styles, drag still works, close/minimize/maximize unchanged. Nothing mobile-specific active yet (Portfolio hasn't started passing `stacked`).

- [ ] **Step 3: Commit**

```bash
git add components/Window.tsx
git commit -m "feat(window): add stacked prop for mobile flow layout"
```

---

## Task 7: Portfolio — deterministic stage + rail + coming-soon closed

**Files:**
- Modify: `components/Portfolio.tsx`

- [ ] **Step 1: Rewrite the component**

Replace the entire `components/Portfolio.tsx` with:

```tsx
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

// Terminal pinned to the right of the rail.
const TERMINAL_X = 76;
const TERMINAL_Y = 28;

// Lettermatch pinned to the top-right with a right margin.
const LETTERMATCH_RIGHT_MARGIN = 40;
const LETTERMATCH_Y = 40;

// Rail occupies roughly left 14..66px. Keep a gap so dragged windows
// don't cover thumbnails.
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
      // Coming-soon apps start closed. They open only if their comingSoon
      // flag flips to false in content/apps.ts (future milestone).
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
      DRAG_MIN_X + TERMINAL_X, // don't overlap terminal
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
      // Live apps re-open at their deterministic initial position.
      // Coming-soon apps never reach here (dock short-circuits with a tooltip).
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
```

- [ ] **Step 2: Verify desktop behavior**

Open http://localhost:3000 in a desktop-width browser (≥768px). Expected:
- Only Terminal and Lettermatch render as windows on first paint.
- Terminal is at top-left (past the rail). Lettermatch is at top-right.
- Left rail shows three thumbnails: I (blue), R (teal), B (pink) — stacked vertically, each ~44px.
- Clicking a rail thumbnail opens a tooltip to its right ("IssueAggregator · launching Q3", etc). Clicking outside dismisses.
- Dock at bottom shows all 5 icons. Terminal + Lettermatch are normal. I/R/B are dimmed with 🔒 badge.
- Clicking Lettermatch's red traffic-light closes it; clicking Lettermatch in the dock reopens it at its original top-right position (NOT at desktop center).
- Arrow-left/right cycles focus among open windows (just Terminal + Lettermatch now).

- [ ] **Step 3: Commit**

```bash
git add components/Portfolio.tsx
git commit -m "feat(portfolio): deterministic stage positions, left rail, coming-soon closed"
```

---

## Task 8: Verify mobile stack

**Files:** no changes — this task is verification of the CSS + Portfolio changes from prior tasks.

- [ ] **Step 1: Test mobile viewport**

In your browser DevTools, enable device emulation and pick iPhone 14 (390×844) or set width to 375.

Expected:
- `mac-desktop` switches to vertical flex layout.
- Left rail is gone.
- Terminal window renders on top in flow layout, at full width of the container.
- Lettermatch window renders below Terminal, also full width.
- No drag, no z-index shuffle; traffic-light buttons in each window still work (close hides, reopen via dock).
- Dock at bottom still shows all 5 icons including locked ones.
- Clicking a locked dock icon shows a tooltip above the icon.
- Page scrolls naturally if content exceeds viewport.
- No horizontal scrollbar.

- [ ] **Step 2: Toggle across breakpoint**

Drag DevTools viewport width across 767px ↔ 768px. Expected: layout flips cleanly between stack and stage. No stale state (windows don't end up with weird offsets when returning to desktop).

- [ ] **Step 3: Test at tablet widths**

Set viewport to 900×700. Expected: desktop layout (rail + stage + dock). Lettermatch still pins to the right edge, not randomly placed.

- [ ] **Step 4: Commit if any fixes were needed**

If Step 1/2/3 were clean, no commit needed; move on.

If you had to patch anything, commit with:

```bash
git add <files>
git commit -m "fix(portfolio): <what you fixed>"
```

---

## Task 9: Regression pass

**Files:** no changes — verification only.

- [ ] **Step 1: Terminal signup flow**

On desktop, click the Terminal window, focus the email input, type a valid email, submit. Expected: exactly today's behavior — command joins history, success line appears, fresh prompt, aria-live region announces. No regression.

- [ ] **Step 2: Keyboard focus cycling**

Click the desktop area. Press arrow-right several times. Expected: focus cycles between Terminal and Lettermatch only (coming-soon apps aren't open, so they're skipped). Arrow-left cycles backward.

- [ ] **Step 3: Dock hover magnification**

Move your mouse slowly across the dock. Expected: icons scale up smoothly near the cursor (existing behavior preserved). The lock badge on coming-soon icons stays attached during magnification.

- [ ] **Step 4: Reduced motion**

In macOS System Settings → Accessibility → Display, toggle "Reduce motion" on. Reload http://localhost:3000. Expected:
- Live dot does not pulse.
- Tooltip still appears but without the fade-in animation.
- Dock magnification still disabled per existing `prefers-reduced-motion` guard.

- [ ] **Step 5: CommentOverlay (dev only)**

The CommentOverlay is gated on `NODE_ENV === "development"`, so it's active in `npm run dev`. Expected: the overlay still toggles and places comments. Dragging a box should not conflict with the rail (rail has `z-index: 2`, overlay renders above).

- [ ] **Step 6: Build**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors. Warnings about unused imports are acceptable if any; errors are not.

- [ ] **Step 7: Commit any fixes**

If any regressions were fixed, commit with `fix(portfolio): <what>`.

---

## Task 10: Final visual QA

**Files:** no changes — visual verification only.

- [ ] **Step 1: Desktop hierarchy check**

Open http://localhost:3000 on desktop. Squint at the page for 2 seconds. Ask: is it unambiguous that Lettermatch is the live thing? Expected: yes — emerald halo + live dot + no competing same-sized windows on the right half.

- [ ] **Step 2: Rail vs dock consistency**

Click the `I` rail thumbnail. Click the `I` dock icon. Expected: both show tooltips with the same text ("IssueAggregator · launching Q3"). Tooltip placement differs (right of rail, above dock) but copy matches.

- [ ] **Step 3: Close-and-reopen determinism**

Close Lettermatch (red X). Close Terminal (red X). Click Lettermatch in dock. Click Terminal in dock. Expected: each window reappears at its original initial position, not drifted to center.

- [ ] **Step 4: No console errors**

Open DevTools Console. Reload. Click rail thumbnails, dock icons, drag windows, close, reopen. Expected: no red errors or warnings introduced by this feature. (Existing Next.js hydration warnings, if any, are acceptable.)

- [ ] **Step 5: Commit**

No file changes. No commit needed. Plan complete.

---

## Self-Review Notes (recorded after writing)

**Spec coverage:**
- Stage Manager metaphor — Tasks 1, 4, 7 ✓
- Initial paint (Terminal + Lettermatch staged, I/R/B rail) — Task 7 ✓
- Rail click = tooltip only — Tasks 2, 4 ✓
- Dock locked icons + tooltip — Tasks 1, 3, 5 ✓
- No drag-to-rail — Task 7 preserves today's close/reopen semantics, no drag-into-rail code introduced ✓
- Mobile: no rail, vertical stack — Tasks 1, 6, 7, 8 ✓
- Re-open live window at deterministic position — Task 7's `openOrFocus` change ✓
- Accessibility (aria-label, aria-describedby, aria-disabled) — Tasks 4, 5 ✓
- Reduced motion — Task 1 tooltip gate, Task 9 regression check ✓

**Placeholder scan:** No "TBD"/"TODO"/"implement later" left in code steps. The one open question in the spec (exact coming-soon copy) is resolved in Task 3 with concrete strings (Q3/Q4 labels).

**Type consistency:** `PopTooltip` signature in Task 2 matches usage in Tasks 4 (LeftRail) and 5 (Dock). `Window.stacked` prop added in Task 6 consumed in Task 7. `App.comingSoonLabel` added in Task 3 consumed in Tasks 4 and 5.
