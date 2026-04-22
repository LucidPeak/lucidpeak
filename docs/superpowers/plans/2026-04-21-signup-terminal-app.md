# Signup Terminal App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `Signup` section with a fifth "Terminal" window inside the existing macOS-metaphor desktop. Subscribing is styled as a shell command. A shrunk one-line mailto hint stays near the footer as fallback.

**Architecture:** One new client component (`Terminal.tsx`) renders inside the existing `Window` chrome via a slug branch in `WindowBody`. One new dock mark component (`TerminalMark.tsx`) handles the two-character `›_` glyph that `AppMark` can't. Registry extension in `content/apps.ts` adds the terminal entry plus optional `width` / `height` fields. `Portfolio.tsx` pins the terminal window to the upper-right on load, other windows keep random placement. `app/globals.css` gets a small terminal-specific style block + keyframes + reduced-motion guards. The existing `Signup.tsx` is replaced in-place by a shrunk label + mailto line.

**Tech Stack:** Next.js 16.2.4, React 19.2.4, TypeScript 5, Tailwind CSS v4 + `app/globals.css`, ESLint 9.

---

## Notes for the executing engineer

**About this codebase (read before writing any Next.js API):**
- `AGENTS.md` says: "This is NOT the Next.js you know. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code." This plan sticks to React client-component primitives (`useState`, `useRef`, `useEffect`, `fetch`) plus regular Tailwind — nothing server-side, no server actions, no route handlers — so the Next 16 delta shouldn't bite you. If you reach for a Next API not already used in the repo, stop and read the docs first.
- **No test framework is installed.** This plan does not add one. Verification per task is: type-check with `npx tsc --noEmit`, lint with `npm run lint`, and manual dev-server checks (`npm run dev`, then open `http://localhost:3000` and confirm the documented UI state). Do NOT invent a test framework mid-flight.
- Dev server is assumed to be running throughout; start it once and leave it (`npm run dev`, reachable at `http://localhost:3000`).
- Commit after every task using the provided message. One task = one commit.

**Spec:** `docs/superpowers/specs/2026-04-21-signup-terminal-design.md` is the source of truth for any detail this plan doesn't restate. Flagged placeholders in the spec (studio email) are called out in Task 11.

---

## File Structure

**Create:**
- `components/Terminal.tsx` — interactive terminal component (state machine, form, demo history, motion).
- `components/TerminalMark.tsx` — dock-icon visual for the terminal slug (dark tile + `›_`).

**Modify:**
- `content/apps.ts` — extend `App` type (make `pitch` optional, add optional `width`/`height`), append `terminal` entry to `apps` array.
- `components/WindowBody.tsx` — early-return when `app.slug === "terminal"`, rendering `<Terminal />` instead of the standard card layout.
- `components/Dock.tsx` — branch on `app.slug === "terminal"` to render `<TerminalMark />` in the dock icon slot instead of `<AppMark />`.
- `components/Portfolio.tsx` — consume optional per-app `width` / `height`, pin the terminal window to upper-right on first layout with lowest starting z.
- `components/Signup.tsx` — rewrite to render the shrunk hint (label + mailto line) in place of the pill form.
- `app/globals.css` — append a `/* === Terminal app === */` block at the end with surface styles, keyframes, reduced-motion guards.

**No changes:**
- `components/Window.tsx`, `components/TitleBar.tsx`, `components/AppMark.tsx`, `app/page.tsx`, `app/layout.tsx`, `components/Hero.tsx`, `components/Footer.tsx`, `components/TrafficLights.tsx`, `components/Portfolio.tsx`'s window rendering loop structure.

Each responsibility is isolated: state/interaction in `Terminal.tsx`, dock icon visual in `TerminalMark.tsx`, integration points in the three integration files (`WindowBody`, `Dock`, `Portfolio`), data in `content/apps.ts`, styling in `globals.css`.

---

## Task 1 — App registry & types

**Files:**
- Modify: `content/apps.ts`

- [ ] **Step 1: Open `content/apps.ts` and read the current type + array.**

Run: `cat content/apps.ts`
Expected: the file currently exports `type App = { slug; name; pitch; tagline?; href?; comingSoon; accent; mark; }` and a 4-entry `apps` array.

- [ ] **Step 2: Edit `content/apps.ts` to relax `pitch`, add optional dimensions, and append the `terminal` entry.**

Full replacement file contents:

```ts
export type App = {
  slug: string;
  name: string;
  pitch?: string;
  tagline?: string;
  href?: string;
  comingSoon: boolean;
  accent: string;
  mark: string;
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
  },
  {
    slug: "issueaggregator",
    name: "IssueAggregator",
    pitch: "A unified board of open-source issues and bounties across GitHub.",
    href: "https://github.com/teodor-i/IssueAggregator",
    comingSoon: true,
    accent: "#7c8ef0",
    mark: "I",
  },
  {
    slug: "hirelay",
    name: "hiRelay",
    pitch: "Content OS for solo creators — one idea, five platform-native outputs, your voice.",
    comingSoon: true,
    accent: "#5ed4b3",
    mark: "R",
  },
  {
    slug: "buildmethis",
    name: "BuildMeThis",
    pitch: "A community board where people post problems and builders ship solutions.",
    tagline: "Wishes meet builders.",
    comingSoon: true,
    accent: "#ef6f8c",
    mark: "B",
  },
  {
    slug: "terminal",
    name: "Terminal",
    comingSoon: false,
    accent: "#1c1b19",
    mark: "›",
    width: 320,
    height: 200,
  },
];
```

- [ ] **Step 3: Type-check.**

Run: `npx tsc --noEmit`
Expected: exit 0. `WindowBody.tsx` accesses `app.pitch` unconditionally on the rendered side (line where it does `{app.pitch}`); with `pitch` now optional this becomes `string | undefined`, which React renders as empty. No type error is expected because `{app.pitch}` accepts `undefined`, but if TypeScript complains re-check that `pitch` usages in `WindowBody.tsx` are conditional (`{app.pitch && ...}`). If anything breaks, fix it now in `WindowBody.tsx` — wrap the `<p>` that renders pitch with `{app.pitch && <p>...</p>}`.

- [ ] **Step 4: Commit.**

```bash
git add content/apps.ts
git commit -m "feat(apps): add terminal entry and optional width/height/pitch to App type"
```

---

## Task 2 — TerminalMark component

**Files:**
- Create: `components/TerminalMark.tsx`

- [ ] **Step 1: Create `components/TerminalMark.tsx`.**

Full file contents:

```tsx
type Props = {
  size?: number;
  className?: string;
};

export function TerminalMark({ size = 32, className = "" }: Props) {
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-[26%] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_10px_-4px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.05] ${className}`}
      style={{
        width: size,
        height: size,
        background: "#1c1b19",
        fontFamily:
          'ui-monospace, "SF Mono", Menlo, Monaco, "Cascadia Mono", monospace',
        fontSize: size * 0.42,
        fontWeight: 600,
        letterSpacing: "-0.03em",
      }}
    >
      ›_
    </span>
  );
}
```

- [ ] **Step 2: Type-check.**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit.**

```bash
git add components/TerminalMark.tsx
git commit -m "feat(terminal): add TerminalMark dock-icon component"
```

---

## Task 3 — Dock & WindowBody slug integration

**Files:**
- Modify: `components/Dock.tsx`
- Modify: `components/WindowBody.tsx`

- [ ] **Step 1: Add the terminal branch to `components/Dock.tsx`.**

Find the `<AppMark ... />` call inside the dock button (currently around line 90–94):

```tsx
<AppMark
  app={app}
  size={32}
  className="transition-[filter] duration-200 group-hover:brightness-105"
/>
```

Replace it with a slug-aware render. Also add the import at the top of the file.

Add this import after the existing imports:

```tsx
import { TerminalMark } from "./TerminalMark";
```

Replace the `<AppMark ... />` call with:

```tsx
{app.slug === "terminal" ? (
  <TerminalMark
    size={32}
    className="transition-[filter] duration-200 group-hover:brightness-105"
  />
) : (
  <AppMark
    app={app}
    size={32}
    className="transition-[filter] duration-200 group-hover:brightness-105"
  />
)}
```

- [ ] **Step 2: Add the terminal branch to `components/WindowBody.tsx`.**

Add this import at the top:

```tsx
import { Terminal } from "./Terminal";
```

Add an early return before the existing return statement so the function body starts like this:

```tsx
export function WindowBody({ app }: Props) {
  if (app.slug === "terminal") {
    return <Terminal />;
  }

  const live = !app.comingSoon && !!app.href;
  // ... rest unchanged
```

Leave the rest of `WindowBody` exactly as it is.

- [ ] **Step 3: Stub `components/Terminal.tsx` so the import resolves.**

Create `components/Terminal.tsx` with a placeholder body. It'll be filled in the following tasks.

```tsx
"use client";

export function Terminal() {
  return (
    <div
      style={{
        background: "#1c1b19",
        color: "#e9e5d8",
        height: "100%",
        padding: 12,
        fontFamily:
          'ui-monospace, "SF Mono", Menlo, Monaco, "Cascadia Mono", monospace',
        fontSize: 12.5,
        lineHeight: 1.55,
      }}
    >
      terminal stub
    </div>
  );
}
```

- [ ] **Step 4: Type-check + lint.**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 5: Manual check.**

Run: `npm run dev` (if not already running) and open `http://localhost:3000`.
Expected: the portfolio area shows 5 dock icons now (the fifth is a dark tile with `›_`). Clicking it opens a window titled "Terminal" showing the text `terminal stub` on a dark surface. Other 4 apps still render normally.

- [ ] **Step 6: Commit.**

```bash
git add components/Dock.tsx components/WindowBody.tsx components/Terminal.tsx
git commit -m "feat(terminal): wire terminal slug into Dock and WindowBody"
```

---

## Task 4 — Portfolio: pin terminal + per-app dimensions

**Files:**
- Modify: `components/Portfolio.tsx`

- [ ] **Step 1: Update `components/Portfolio.tsx` to consume per-app `width`/`height` and pin the terminal.**

There are three edits inside this file.

Edit A: in the `useLayoutEffect` that randomly places windows (currently uses `PAD`, `maxX`, `maxY`, and `rand`), skip the terminal and pin it to upper-right with its own dimensions. Also set its starting z to 0 so it sits below the other four on first paint.

Replace the existing `setWindows((prev) => prev.map(...))` block inside the `useLayoutEffect` with:

```tsx
setWindows((prev) =>
  prev.map((w) => {
    if (w.slug === "terminal") {
      const app = initialApps.find((a) => a.slug === "terminal");
      const tw = app?.width ?? WIN_W;
      const th = app?.height ?? WIN_H;
      const tx = Math.max(PAD, rect.width - tw - 24);
      const ty = 28;
      return { ...w, x: tx, y: ty, z: 0 };
    }
    return {
      ...w,
      x: rand(PAD, maxX),
      y: rand(PAD, maxY),
    };
  }),
);
```

(Keep `positioned.current = true;` after this block exactly as it is.)

Edit B: in the `openOrFocus` function, the fallback re-open position uses `WIN_W` / `WIN_H`. Leave it as-is — a user who closes and reopens the terminal is fine landing near center with default width, same as the other apps. No change needed here.

Edit C: in the `initialApps.map` render loop, pass the per-app width/height to `<Window>`. Replace:

```tsx
<Window
  key={app.slug}
  app={app}
  x={w.x}
  y={w.y}
  z={w.z}
  width={WIN_W}
  height={WIN_H}
  ...
```

with:

```tsx
<Window
  key={app.slug}
  app={app}
  x={w.x}
  y={w.y}
  z={w.z}
  width={app.width ?? WIN_W}
  height={app.height ?? WIN_H}
  ...
```

(The remaining props — `focused`, `minimized`, `maximized`, `desktopRef`, `onFocus`, `onMove`, `onClose`, `onMinimize`, `onMaximizeToggle` — stay unchanged.)

- [ ] **Step 2: Type-check + lint.**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 3: Manual check.**

Refresh `http://localhost:3000`.
Expected: Terminal window (320 × 200) now appears pinned to the upper-right of the portfolio desktop on first load. The four project windows are still randomly placed. Clicking any project window raises it above the terminal (existing focus logic). Clicking the `›_` dock icon raises the terminal to the front.

- [ ] **Step 4: Commit.**

```bash
git add components/Portfolio.tsx
git commit -m "feat(terminal): pin terminal window to upper-right with custom dimensions"
```

---

## Task 5 — Terminal: static chrome & demo history

**Files:**
- Modify: `components/Terminal.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Append terminal styles at the end of `app/globals.css`.**

Append this block verbatim:

```css
/* === Terminal app === */
.term-surface {
  position: absolute;
  inset: 0;
  background: #1c1b19;
  color: #e9e5d8;
  font-family: ui-monospace, "SF Mono", Menlo, Monaco, "Cascadia Mono", monospace;
  font-size: 12.5px;
  line-height: 1.55;
  padding: 12px;
  overflow-y: auto;
  overflow-x: hidden;
  white-space: pre-wrap;
  word-break: break-all;
}
.term-dim     { color: #a7a196; }
.term-prompt  { color: #8ba97a; }
.term-flag    { color: #e5a853; }
.term-err     { color: #ef6f8c; }
.term-success { color: #8ba97a; }

.term-line { display: block; }

.term-input {
  background: transparent;
  border: none;
  outline: none;
  color: #e9e5d8;
  font: inherit;
  caret-color: transparent; /* custom caret block renders separately */
  padding: 0;
  margin: 0;
  width: 100%;
  min-width: 0;
  flex: 1 1 auto;
}

.term-prompt-line {
  display: flex;
  align-items: baseline;
  gap: 0;
}
.term-prompt-line.focused {
  box-shadow: inset 2px 0 0 #e9e5d8;
  padding-left: 4px;
  margin-left: -4px;
}

.term-caret {
  display: inline-block;
  width: 7px;
  height: 14px;
  background: #e9e5d8;
  margin-left: 1px;
  vertical-align: -2px;
  animation: term-blink 1s steps(2, end) infinite;
}
.term-caret.solid { animation: none; }

@keyframes term-blink {
  50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .term-caret { animation: none; }
}
```

- [ ] **Step 2: Replace `components/Terminal.tsx` with the static-only version.**

Full file contents:

```tsx
"use client";

export function Terminal() {
  return (
    <div className="term-surface" aria-label="Subscribe to updates" role="region">
      <div className="term-line term-dim">lucidpeak — studio terminal</div>
      <div className="term-line term-dim">type and press return</div>
      <div className="term-line">&nbsp;</div>

      <div aria-hidden="true">
        <div className="term-line">
          <span className="term-prompt">$ </span>
          subscribe <span className="term-flag">--email</span> luna@hello.com
        </div>
        <div className="term-line term-success">✓ subscribed. see you soon.</div>
      </div>

      <div className="term-line">&nbsp;</div>

      <div className="term-prompt-line">
        <span className="term-prompt" aria-hidden="true">$ </span>
        <span aria-hidden="true">subscribe&nbsp;</span>
        <span className="term-flag" aria-hidden="true">--email&nbsp;</span>
        <span className="term-caret" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check + lint.**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 4: Manual check.**

Refresh `http://localhost:3000`.
Expected: Terminal window shows, top to bottom:
- two dim gray header lines ("lucidpeak — studio terminal", "type and press return")
- a blank line
- a demo command `$ subscribe --email luna@hello.com` (prompt in green, flag in gold)
- a green success line `✓ subscribed. see you soon.`
- a blank line
- a fresh prompt line `$ subscribe --email ` with a blinking cream-colored caret at the end

The caret blinks at 1s step(2). No interaction yet — typing does nothing.

- [ ] **Step 5: Commit.**

```bash
git add components/Terminal.tsx app/globals.css
git commit -m "feat(terminal): render static terminal chrome with demo history"
```

---

## Task 6 — Terminal: interactive state machine (happy path)

**Files:**
- Modify: `components/Terminal.tsx`

- [ ] **Step 1: Replace `components/Terminal.tsx` with the interactive implementation (happy path only; error branches land in Task 7).**

Full file contents:

```tsx
"use client";

import { useRef, useState } from "react";

type HistoryEntry =
  | { kind: "submission"; email: string }
  | { kind: "success" };

type Status = "idle" | "typing" | "submitting" | "success" | "error";

export function Terminal() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);

  const focusInput = () => inputRef.current?.focus();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = email.trim();
    if (!value.includes("@") || value.length === 0 || value.length > 254) {
      // Error branch handled in Task 7 — for now, no-op.
      return;
    }
    setStatus("submitting");
    try {
      const endpoint = process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT;
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: value }),
        });
        if (!res.ok) throw new Error("request failed");
      }
      setHistory((prev) => [
        ...prev,
        { kind: "submission", email: value },
        { kind: "success" },
      ]);
      setStatus("success");
      setEmail("");
      // Return to idle so the new prompt is live.
      setStatus("idle");
    } catch {
      // Error branch handled in Task 7 — no-op for now.
      setStatus("idle");
    }
  };

  return (
    <div
      ref={surfaceRef}
      className="term-surface"
      onClick={focusInput}
      role="region"
      aria-label="Subscribe to updates"
    >
      <div className="term-line term-dim">lucidpeak — studio terminal</div>
      <div className="term-line term-dim">type and press return</div>
      <div className="term-line">&nbsp;</div>

      <div aria-hidden="true">
        <div className="term-line">
          <span className="term-prompt">$ </span>
          subscribe <span className="term-flag">--email</span> luna@hello.com
        </div>
        <div className="term-line term-success">✓ subscribed. see you soon.</div>
      </div>

      <div className="term-line">&nbsp;</div>

      {history.map((entry, i) =>
        entry.kind === "submission" ? (
          <div className="term-line" key={`h-${i}`}>
            <span className="term-prompt">$ </span>
            subscribe <span className="term-flag">--email</span> {entry.email}
          </div>
        ) : (
          <div className="term-line term-success" key={`h-${i}`}>
            ✓ subscribed. see you soon.
          </div>
        ),
      )}

      {status === "submitting" && (
        <div className="term-line term-dim">…</div>
      )}

      <form onSubmit={onSubmit} aria-label="Subscribe to updates">
        <label htmlFor="sub-email" className="sr-only">
          Email address
        </label>
        <div className={`term-prompt-line ${focused ? "focused" : ""}`}>
          <span className="term-prompt" aria-hidden="true">$&nbsp;</span>
          <span aria-hidden="true">subscribe&nbsp;</span>
          <span className="term-flag" aria-hidden="true">--email&nbsp;</span>
          <input
            ref={inputRef}
            id="sub-email"
            className="term-input"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status !== "submitting") setStatus("typing");
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={status === "submitting"}
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            aria-describedby="sub-hint"
          />
          <span
            className={`term-caret ${status === "submitting" ? "solid" : ""}`}
            aria-hidden="true"
          />
        </div>
        <span id="sub-hint" className="sr-only">
          Press Return to subscribe.
        </span>
        <button type="submit" className="sr-only">
          Subscribe
        </button>
      </form>

      <div role="status" aria-live="polite" className="sr-only">
        {status === "success" ? "Subscribed. See you soon." : ""}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check + lint.**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 3: Manual check (happy path).**

Refresh `http://localhost:3000`. Click the terminal window to focus. Click inside the prompt line — the cursor should be in the input (focus ring appears as a 2px inset on the left of the prompt line).

Type `test@example.com`. Press Return.

Expected sequence:
1. The submitted command `$ subscribe --email test@example.com` locks in as a history line above the prompt.
2. A green `✓ subscribed. see you soon.` line appears directly under it.
3. A fresh empty prompt `$ subscribe --email ` appears below with a blinking caret.
4. The input is empty and focused.

If `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` is unset (likely in dev), the POST is skipped and success is immediate — that's the current `Signup.tsx` contract preserved.

Screen-reader check (optional): with VoiceOver or the browser's accessibility inspector, the live region should announce "Subscribed. See you soon." once.

- [ ] **Step 4: Commit.**

```bash
git add components/Terminal.tsx
git commit -m "feat(terminal): interactive prompt with submit → history happy path"
```

---

## Task 7 — Terminal: error branches

**Files:**
- Modify: `components/Terminal.tsx`

- [ ] **Step 1: Extend the state and history union to carry errors.**

Full replacement file contents for `components/Terminal.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";

type HistoryEntry =
  | { kind: "submission"; email: string }
  | { kind: "success" }
  | { kind: "error"; message: string };

type Status = "idle" | "typing" | "submitting" | "success" | "error";

const ERR_INVALID_VISUAL = "err: not a valid email";
const ERR_NETWORK_VISUAL = "err: couldn't reach the server — try again?";
const ERR_INVALID_SR = "Not a valid email address.";
const ERR_NETWORK_SR = "Couldn't reach the server. Try again.";
const SUCCESS_SR = "Subscribed. See you soon.";

function isValidEmail(value: string) {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  if (!trimmed.includes("@")) return false;
  return true;
}

export function Terminal() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [focused, setFocused] = useState(false);
  const [lastAnnouncement, setLastAnnouncement] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);

  const focusInput = () => inputRef.current?.focus();

  const appendErrorHistory = (visual: string, sr: string, submitted: string) => {
    setHistory((prev) => [
      ...prev,
      { kind: "submission", email: submitted },
      { kind: "error", message: visual },
    ]);
    setLastAnnouncement(sr);
    setStatus("error");
    // Pre-select the invalid value so the user can retype immediately.
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = email.trim();
    if (!isValidEmail(value)) {
      appendErrorHistory(ERR_INVALID_VISUAL, ERR_INVALID_SR, value);
      return;
    }
    setStatus("submitting");
    try {
      const endpoint = process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT;
      if (endpoint) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: value }),
            signal: controller.signal,
          });
          if (!res.ok) throw new Error("request failed");
        } finally {
          clearTimeout(timeoutId);
        }
      }
      setHistory((prev) => [
        ...prev,
        { kind: "submission", email: value },
        { kind: "success" },
      ]);
      setLastAnnouncement(SUCCESS_SR);
      setEmail("");
      setStatus("idle");
    } catch {
      appendErrorHistory(ERR_NETWORK_VISUAL, ERR_NETWORK_SR, value);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (status === "error" || status === "success") setStatus("typing");
    else if (status === "idle") setStatus("typing");
  };

  return (
    <div
      ref={surfaceRef}
      className="term-surface"
      onClick={focusInput}
      role="region"
      aria-label="Subscribe to updates"
    >
      <div className="term-line term-dim">lucidpeak — studio terminal</div>
      <div className="term-line term-dim">type and press return</div>
      <div className="term-line">&nbsp;</div>

      <div aria-hidden="true">
        <div className="term-line">
          <span className="term-prompt">$ </span>
          subscribe <span className="term-flag">--email</span> luna@hello.com
        </div>
        <div className="term-line term-success">✓ subscribed. see you soon.</div>
      </div>

      <div className="term-line">&nbsp;</div>

      {history.map((entry, i) => {
        if (entry.kind === "submission") {
          return (
            <div className="term-line" key={`h-${i}`}>
              <span className="term-prompt">$ </span>
              subscribe <span className="term-flag">--email</span> {entry.email}
            </div>
          );
        }
        if (entry.kind === "success") {
          return (
            <div className="term-line term-success" key={`h-${i}`}>
              ✓ subscribed. see you soon.
            </div>
          );
        }
        return (
          <div className="term-line term-err" key={`h-${i}`}>
            {entry.message}
          </div>
        );
      })}

      {status === "submitting" && (
        <div className="term-line term-dim">…</div>
      )}

      <form onSubmit={onSubmit} aria-label="Subscribe to updates">
        <label htmlFor="sub-email" className="sr-only">
          Email address
        </label>
        <div className={`term-prompt-line ${focused ? "focused" : ""}`}>
          <span className="term-prompt" aria-hidden="true">$&nbsp;</span>
          <span aria-hidden="true">subscribe&nbsp;</span>
          <span className="term-flag" aria-hidden="true">--email&nbsp;</span>
          <input
            ref={inputRef}
            id="sub-email"
            className="term-input"
            type="email"
            required
            value={email}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={status === "submitting"}
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            aria-describedby="sub-hint"
          />
          <span
            className={`term-caret ${status === "submitting" ? "solid" : ""}`}
            aria-hidden="true"
          />
        </div>
        <span id="sub-hint" className="sr-only">
          Press Return to subscribe.
        </span>
        <button type="submit" className="sr-only">
          Subscribe
        </button>
      </form>

      <div role="status" aria-live="polite" className="sr-only">
        {lastAnnouncement}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check + lint.**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 3: Manual check (error paths).**

Invalid email: focus terminal, type `not-an-email`, press Return.
Expected: history grows by `$ subscribe --email not-an-email` then `err: not a valid email` (red). A fresh prompt is below with `not-an-email` re-populated and selected so another keystroke replaces it.

Network failure: temporarily set an invalid `NEXT_PUBLIC_NEWSLETTER_ENDPOINT`. Create a `.env.local` at the project root with:
```
NEXT_PUBLIC_NEWSLETTER_ENDPOINT=http://127.0.0.1:1/does-not-exist
```
Restart dev server. Submit a valid-looking email.
Expected: a brief `…` line appears while the request fails, then `err: couldn't reach the server — try again?` (red) is appended to history. Delete the `.env.local` line when done.

Happy path still works (no endpoint → success).

- [ ] **Step 4: Commit.**

```bash
git add components/Terminal.tsx
git commit -m "feat(terminal): error branches for invalid email and network failure"
```

---

## Task 8 — Terminal: click-to-focus, caret behavior, focus indicator

**Files:** (no new edits — verifying prior work)

- [ ] **Step 1: Verify click-to-focus.**

On `http://localhost:3000`, click anywhere inside the terminal surface that's NOT the prompt line (for example, the dim header text). The hidden input at the bottom should gain focus (focus ring renders on the prompt line).

- [ ] **Step 2: Verify focus indicator.**

Tab into the terminal input via keyboard (from the dock icon: Enter on terminal dock icon → Tab). The 2px inset shadow should appear on the prompt line when focused. On blur the shadow disappears.

- [ ] **Step 3: Verify caret behavior.**

Caret blinks in `idle` and `typing`. During `submitting` (harder to trigger without the broken endpoint), caret is solid. After a success lands, the fresh prompt's caret blinks again.

If any of the three fails, stop and fix `components/Terminal.tsx` before continuing. The state machine and `term-prompt-line.focused` class should cover all three — the check here is to catch regressions from Task 7, not introduce new behavior.

- [ ] **Step 4: Commit only if fixes were needed.**

No changes expected; this is a verification task. If a fix was required, commit it with a descriptive message. Otherwise skip the commit.

---

## Task 9 — Terminal: stage reveal, submit pulse, success slide, error shake

**Files:**
- Modify: `app/globals.css`
- Modify: `components/Terminal.tsx`

- [ ] **Step 1: Append animation styles to `app/globals.css`.**

Append this block to the end of the file (after the Terminal block added in Task 5):

```css
/* === Terminal motion === */
.term-stage > * {
  opacity: 0;
  animation: term-reveal 220ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.term-stage > *:nth-child(1) { animation-delay: 0ms; }
.term-stage > *:nth-child(2) { animation-delay: 40ms; }
.term-stage > *:nth-child(3) { animation-delay: 80ms; }
.term-stage > *:nth-child(4) { animation-delay: 120ms; }
.term-stage > *:nth-child(5) { animation-delay: 360ms; }
.term-stage > *:nth-child(6) { animation-delay: 400ms; }
.term-stage > *:nth-child(7) { animation-delay: 560ms; }
.term-stage > *:nth-child(n+8) { animation-delay: 600ms; }

@keyframes term-reveal {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.term-submitting-dots {
  animation: term-dots 1.2s ease-in-out infinite;
}
@keyframes term-dots {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 1; }
}

.term-history-enter {
  animation: term-slide 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes term-slide {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.term-shake {
  animation: term-shake 180ms cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes term-shake {
  0%   { transform: translateX(0); }
  33%  { transform: translateX(-3px); }
  66%  { transform: translateX(3px); }
  100% { transform: translateX(0); }
}

@media (prefers-reduced-motion: reduce) {
  .term-stage > *,
  .term-history-enter,
  .term-submitting-dots,
  .term-shake {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
```

- [ ] **Step 2: Update `components/Terminal.tsx` to apply the motion classes.**

Two edits in `components/Terminal.tsx`:

Edit A: wrap the whole content (inside the `term-surface` div) in a `div` with class `term-stage` so the stage reveal fires on mount. Also track a `shake` boolean and a `justErrored` flag to trigger the shake animation.

Add at the top of `Terminal`:

```tsx
const [shakeKey, setShakeKey] = useState(0);
```

In `appendErrorHistory`, after `setStatus("error")`, add:

```tsx
setShakeKey((k) => k + 1);
```

Edit B: add the class conditions.

Replace the root `<div className="term-surface" ...>` with:

```tsx
<div
  ref={surfaceRef}
  key={shakeKey}
  className={`term-surface ${shakeKey > 0 ? "term-shake" : ""}`}
  onClick={focusInput}
  role="region"
  aria-label="Subscribe to updates"
>
```

Wait — using `key` to force re-mount would nuke focus and history. Don't do that. Instead, drive the shake via a transient class toggle.

Replace the approach with a data-driven class:

```tsx
const [shaking, setShaking] = useState(false);
```

In `appendErrorHistory` (after `setStatus("error")`):

```tsx
setShaking(true);
setTimeout(() => setShaking(false), 220);
```

Root div becomes:

```tsx
<div
  ref={surfaceRef}
  className={`term-surface ${shaking ? "term-shake" : ""}`}
  onClick={focusInput}
  role="region"
  aria-label="Subscribe to updates"
>
  <div className="term-stage">
    {/* everything that was inside before */}
  </div>
</div>
```

Wrap the existing children (header lines, demo history, blank line, `{history.map(...)}`, `{status === "submitting" && ...}`, the `<form>`, and the `<div role="status" ...>`) in that new `<div className="term-stage">`.

Edit C: apply `term-history-enter` to each history item and `term-submitting-dots` to the submitting line.

Change the history map: each returned element gets `className="term-line term-history-enter"` (or `term-line term-history-enter term-success` for success, `term-line term-history-enter term-err` for errors).

Change the submitting block to:

```tsx
{status === "submitting" && (
  <div className="term-line term-dim term-submitting-dots">…</div>
)}
```

- [ ] **Step 3: Type-check + lint.**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 4: Manual check.**

Refresh `http://localhost:3000`. Watch the terminal window on first paint: content should stage-reveal over ~600–800ms total. Submit a valid email: the submitted command and success line should slide in 4px upward, not pop. Submit an invalid email: the whole terminal container should do a single 180ms horizontal shake.

Toggle `prefers-reduced-motion` (DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`) and confirm: caret solid, no stage reveal, no history slide, no shake, no submit-dot pulse.

- [ ] **Step 5: Commit.**

```bash
git add app/globals.css components/Terminal.tsx
git commit -m "feat(terminal): stage reveal, submit pulse, history slide, error shake (reduced-motion guarded)"
```

---

## Task 10 — Dock minimized-success breath animation

**Files:**
- Modify: `app/globals.css`
- Modify: `components/Portfolio.tsx`
- Modify: `components/Dock.tsx`
- Modify: `components/Terminal.tsx`

- [ ] **Step 1: Append the breath animation to `app/globals.css`.**

Append:

```css
/* === Terminal dock breath (fires once when hidden success lands) === */
.dock-breath {
  animation: dock-breath 1500ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes dock-breath {
  0% {
    box-shadow: 0 0 0 0 rgba(139, 169, 122, 0);
  }
  40% {
    box-shadow: 0 0 0 4px rgba(139, 169, 122, 0.35);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(139, 169, 122, 0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .dock-breath { animation: none; }
}
```

- [ ] **Step 2: Surface a callback from `Terminal.tsx` for "success while hidden".**

The cleanest wire is a global custom event the dock listens for, so the terminal doesn't need prop threading. Inside `onSubmit` in `Terminal.tsx`, after the success branch `setStatus("idle")`, dispatch an event:

```tsx
if (document.visibilityState === "visible") {
  window.dispatchEvent(new CustomEvent("lp:terminal-success"));
}
```

Actually, the event should fire regardless — the dock will decide whether to animate based on the window being minimized. Simplify: always dispatch.

Replace the dispatch with:

```tsx
window.dispatchEvent(new CustomEvent("lp:terminal-success"));
```

Final position inside `onSubmit` (happy path only, right after `setStatus("idle")`):

```tsx
setHistory((prev) => [
  ...prev,
  { kind: "submission", email: value },
  { kind: "success" },
]);
setLastAnnouncement(SUCCESS_SR);
setEmail("");
setStatus("idle");
window.dispatchEvent(new CustomEvent("lp:terminal-success"));
```

- [ ] **Step 3: Listen for the event in `Dock.tsx` and breathe the terminal icon only if it's currently minimized.**

Add two new pieces of state/effect inside the `Dock` component.

Near the existing state (`cursorX`), add:

```tsx
const [breath, setBreath] = useState(0);
```

Add this effect next to the existing keydown effect:

```tsx
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
```

Then, in the dock button for the terminal icon, add a className that changes on each breath. The simplest tying is to add `${breath ? "dock-breath" : ""}` to the outer `<button>` and use `key={...-${breath}}` to remount so the animation re-fires.

Locate the `<button ...>` inside the `.map()` and modify only the terminal branch. Wrap:

```tsx
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
```

with:

```tsx
<button
  ref={(el) => {
    refs.current[app.slug] = el;
  }}
  role="tab"
  aria-selected={focused}
  aria-label={`${app.name}${app.comingSoon ? " (coming soon)" : ""}`}
  onClick={() => onDockClick(app.slug)}
  className={`group relative flex items-center justify-center rounded-[12px] active:scale-95 ${
    app.slug === "terminal" && breath > 0 ? "dock-breath" : ""
  }`}
  key={app.slug === "terminal" ? `btn-${breath}` : app.slug}
>
```

(The surrounding `<li>` still uses `key={app.slug}` from the outer map — keep that.)

- [ ] **Step 4: Type-check + lint.**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 5: Manual check.**

Minimize the Terminal window (click the yellow traffic light). Submit form via keyboard — wait, you can't: the window's not visible. Instead:
1. With Terminal open, type a valid email.
2. Don't press Return yet — minimize the window first.
3. You can't, because focus leaves the window. OK: alternative test.

Real test sequence: open Terminal, type a valid email, press Return while window is open (this confirms the event fires but the breath does NOT trigger because `term.minimized === false`). Then, minimize Terminal, restore it, submit another email while minimized (simulate by calling `window.dispatchEvent(new CustomEvent("lp:terminal-success"))` from the browser devtools console while Terminal is minimized). The dock icon should pulse a soft green ring once (~1.5s) and settle.

Quick devtools path: with the Terminal minimized, paste in the console:

```js
window.dispatchEvent(new CustomEvent("lp:terminal-success"));
```

Expected: the `›_` dock icon does one breath pulse.

- [ ] **Step 6: Commit.**

```bash
git add app/globals.css components/Terminal.tsx components/Dock.tsx
git commit -m "feat(terminal): breath pulse on terminal dock icon when success lands while minimized"
```

---

## Task 11 — Shrunk signup hint

**Files:**
- Modify: `components/Signup.tsx`

- [ ] **Step 1: Confirm the studio email.**

The spec flagged `hello@lucidpeak.co` as a placeholder. Before editing, check the repo for any actual inbox reference:

Run: `grep -RniE "hello@|contact@|mailto:" --include='*.{md,ts,tsx,json}' .`
Expected: no prior mailto. If nothing turns up, confirm with the user before proceeding. If the user says "use `hello@lucidpeak.co`", proceed with that value. Record the decision in a commit body comment.

- [ ] **Step 2: Replace `components/Signup.tsx` with the shrunk hint.**

Full replacement file (substitute `hello@lucidpeak.co` with whatever address the user confirmed):

```tsx
export function Signup() {
  return (
    <section
      aria-label="Updates"
      className="mx-auto flex w-full max-w-md flex-col items-center gap-1 py-6 text-center"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
        Follow along
      </p>
      <p className="text-[13px] text-zinc-700">
        or drop a line:{" "}
        <a
          href="mailto:hello@lucidpeak.co"
          className="underline-offset-4 hover:underline"
        >
          hello@lucidpeak.co
        </a>
      </p>
    </section>
  );
}
```

- [ ] **Step 3: Type-check + lint.**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 4: Manual check.**

Refresh `http://localhost:3000`. Scroll past the portfolio. Where the old pill was, there is now a small two-line hint: `FOLLOW ALONG` in tracked uppercase, `or drop a line: hello@lucidpeak.co` underneath with the email as a hoverable underline link. Block height feels light, roughly 56px total.

Click the link: mail client opens with the address pre-filled.

- [ ] **Step 5: Commit.**

```bash
git add components/Signup.tsx
git commit -m "feat(signup): shrink signup section to footer-adjacent mailto hint"
```

---

## Task 12 — Final QA against spec

**Files:** (none modified)

- [ ] **Step 1: Page structure check.**

At `http://localhost:3000`:
- Hero still at top.
- Portfolio shows 5 dock icons. Fifth is dark `›_`.
- Terminal window pinned upper-right on first load with the staged reveal.
- Shrunk signup hint below the portfolio.
- Footer unchanged.

- [ ] **Step 2: Happy-path submission.**

Submit a valid email. Confirm: command joins history, green success line appears, fresh prompt below, input cleared, live region announced "Subscribed. See you soon."

- [ ] **Step 3: Invalid email.**

Submit `nope`. Confirm: shake fires, red `err: not a valid email` appears, input text pre-selected, live region announces "Not a valid email address."

- [ ] **Step 4: Network error.**

Add to `.env.local`:
```
NEXT_PUBLIC_NEWSLETTER_ENDPOINT=http://127.0.0.1:1/nope
```
Restart dev server. Submit a valid-looking email. Expect `…` pulse briefly, then red `err: couldn't reach the server — try again?`. Live region announces "Couldn't reach the server. Try again." Remove the line from `.env.local` when done.

- [ ] **Step 5: Window lifecycle.**

Close terminal window via red traffic light. Reopen via dock icon. History persists.

Minimize via yellow traffic light. Dispatch `window.dispatchEvent(new CustomEvent("lp:terminal-success"))` from devtools console. Dock icon breathes once. Restore via dock click.

- [ ] **Step 6: Keyboard-only path.**

Reload page. Tab through — focus eventually reaches the dock row. Arrow right across dock icons (or Tab, depending on browser). Enter on terminal icon: window focuses. Tab until the input has focus (the inset ring appears on the prompt line). Type, Return. Happy path completes.

- [ ] **Step 7: Reduced motion.**

DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`. Reload. Caret solid. Stage-reveal instant. Submit: history appears without slide. Error: no shake.

- [ ] **Step 8: Mobile viewport.**

DevTools → responsive mode → 375 × 812. The terminal is still pinned top-right and visible. Soft keyboard simulation: focus the input, confirm the prompt stays visible.

- [ ] **Step 9: Production build sanity.**

Run: `npm run build`
Expected: build succeeds. No type errors. No runtime warnings beyond the usual Next.js hydration info.

- [ ] **Step 10: Lint.**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 11: Commit any trailing fixups.**

If earlier tasks left any file with unstaged whitespace or a missed comment, stage and commit with a descriptive message. Otherwise, skip this step.

- [ ] **Step 12: Announce completion to the user with the summary of what landed and any open items flagged from the spec's "Open questions" section that still aren't resolved.**

---

## Self-review notes (recorded after writing)

- Spec coverage check: all six spec sections (Architecture, State machine, Visual, Motion, A11y, Failure modes) are referenced by at least one task. History persistence via component-level state is handled in Task 6. The pre-existing `Window.tsx` gaps flagged in the spec's "Open questions" are not touched by this plan, matching the spec's decision to leave them out of scope.
- Placeholder scan: no `TBD`/`TODO`/"implement later" strings left in the plan. Verification steps have concrete commands.
- Type consistency: `HistoryEntry`, `Status`, the `onSubmit` signature, and `appendErrorHistory` appear in Tasks 6 and 7 with consistent names. `term-prompt-line`, `term-caret`, `term-stage`, `term-history-enter`, `term-shake`, `term-submitting-dots`, `dock-breath` class names are consistent between the CSS task that introduces them and the component tasks that apply them.
- One known simplification: Task 6 briefly uses `setStatus("success")` then immediately `setStatus("idle")` — Task 7 removes the transient `success` call and just sets `idle` after appending history + announcement. The `Status` union still lists `"success"` because the spec's state machine names it; nothing in the UI renders directly based on `status === "success"` in the final form, but it's kept in the type for documentation parity with the spec.
