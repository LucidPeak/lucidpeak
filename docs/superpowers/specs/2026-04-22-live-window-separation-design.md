# Live Window Separation — Design Spec

**Date:** 2026-04-22
**Status:** Locked for planning
**Scope:** Visually separate live (shipped) apps from coming-soon apps on the Portfolio desktop so the live window isn't lost among placeholders.

## Problem

Today's `Portfolio.tsx` renders five windows on a single mac-display: Terminal (pinned left), Lettermatch, IssueAggregator, hiRelay, BuildMeThis (randomized on the right half). Only Lettermatch is actually live (`comingSoon: false`, has `href`). The live window has an emerald halo and pulsing "live" dot, but with four equally-sized siblings competing, the live signal is lost. A visitor skimming the page can't tell which of the five apps they can actually use right now.

## Design decisions (all locked)

1. **Metaphor:** macOS Stage Manager. Live windows hold center stage. Coming-soon apps collapse into a left-edge rail of small thumbnails.
2. **Initial paint:** Terminal and Lettermatch are staged (visible center). IssueAggregator, hiRelay, BuildMeThis appear as thumbnails on the left rail.
3. **Rail click:** Tooltip only. Never opens a window. The rail is a preview/status surface, not a launcher.
4. **Dock:** Remains centered-bottom with all five apps. Live icons (Terminal, Lettermatch) are fully clickable — they open, focus, or minimize windows exactly like today. Coming-soon icons are dimmed + carry a lock glyph; click shows a tooltip above the icon. The dock is the only launcher.
5. **No drag-to-rail.** Closing a staged window behaves like today (window hides, dock icon re-opens). The rail never grows or shrinks at runtime; it always holds the three coming-soon apps.
6. **Mobile (<768px):** No rail. Windows stack vertically — Terminal on top, Lettermatch below, no dragging, no z-index shuffling. Dock stays with all five icons (coming-soon still locked). Natural page scroll if the stack exceeds viewport.

## Architecture

### New component: `components/LeftRail.tsx`

Renders a vertical column of thumbnail buttons, one per coming-soon app. Positioned absolute inside the `mac-desktop` container, flush to the left edge with a small inset.

```
LeftRail props: { apps: App[] }
  - apps is the filtered coming-soon list (same source as today: apps[].comingSoon === true)
  - renders one <button> per app with the app's AppMark at thumbnail size (~44px)
  - click opens a tooltip ("<App name> · coming soon") pinned to the thumbnail
  - on `md:` breakpoint and below the whole component renders null (mobile hides the rail)
```

Tooltip pattern: lightweight, CSS-driven, no portal. Opens on click (not hover) so it works on touch. Dismisses on next click elsewhere or after ~3s.

### Modified: `components/Portfolio.tsx`

Three changes:

1. **Initial positioning** — stop randomizing Lettermatch. Pin Terminal top-left (current `24,28`). Pin Lettermatch deterministically to the right of Terminal with comfortable spacing. The other three apps (IssueAggregator, hiRelay, BuildMeThis) are NOT rendered as windows on initial paint — they exist in state as `open: false` so the dock can still open them.
2. **Rail render** — mount `<LeftRail apps={comingSoonApps} />` inside `mac-desktop`, above the windows in the DOM order but below any window chrome via z-index (rail is z-index 2, windows z-index 3+, dock z-index 9999).
3. **Mobile layout** — detect viewport via CSS (`@media (max-width: 767px)`) rather than JS. On mobile, the desktop container switches to vertical flex layout. Windows ignore their `x`/`y`/`z` positional props and flow naturally. No drag handling runs on mobile.

### Modified: `components/Dock.tsx`

Coming-soon icons (`app.comingSoon === true`) render with:

- A lock glyph (`🔒` or inline SVG) pinned to the bottom-right of the icon
- Reduced opacity (`opacity-50` instead of current `opacity-85`)
- Click shows a tooltip above the icon. Copy is per-app (see draft strings under Open questions).
- Click does NOT call `onDockClick` (short-circuits before Portfolio's handler fires)

Live icons behave exactly like today.

### Unchanged

- `Window.tsx` — no changes. Close/minimize/maximize behave identically.
- `WindowBody.tsx` — no changes.
- `content/apps.ts` — no changes.
- Terminal interactions, signup flow, comment overlay — untouched.

## Layout & breakpoints

| Viewport | Rail | Stage | Dock |
|---|---|---|---|
| ≥768px | Visible, left edge, ~52px wide | Absolute-positioned windows (Terminal + Lettermatch initial, others open via dock) | All 5, centered bottom |
| <768px | Hidden | Vertical flex stack (Terminal, Lettermatch, plus any opened) | All 5, centered bottom |

Rail width: 52px outer (44px thumbnail + 8px inset).
Stage horizontal offset: when rail is present, window bounds start at `60px` left (rail-width + 8px gap) instead of today's free-range.

## Interaction contract

| Action | Result |
|---|---|
| Click rail thumbnail | Tooltip opens. No window change. |
| Click rail thumbnail again (or outside) | Tooltip closes. |
| Click live dock icon (e.g. Lettermatch) | Today's behavior: open if closed, focus if unfocused, minimize if focused. |
| Click locked dock icon (coming-soon) | Tooltip opens above dock icon. No window change. |
| Red traffic light on staged window | Window hides (today's behavior). Dock icon re-opens at the same deterministic initial-paint position, not at desktop center. |
| Yellow (minimize) | Today's behavior. |
| Drag staged window | Today's behavior (no rail-docking semantic). Drag bounds respect rail: `x >= 60` on desktop. |
| Keyboard arrow-left / arrow-right | Today's focus-cycle behavior. Skips apps that aren't open. |

## Accessibility

- Rail thumbnails are `<button type="button">` with `aria-label="<App name>, coming soon"` and `aria-describedby` pointing at the tooltip when open.
- Tooltip uses `role="tooltip"` and is announced via `aria-describedby` on focus.
- Rail is inside a `<nav aria-label="Coming soon">` landmark.
- Locked dock icons get `aria-disabled="true"` + `aria-label="<App name>, coming soon"` (current aria-label already handles the coming-soon suffix).
- Pulsing live dot already respects `prefers-reduced-motion: reduce` in `app/globals.css`; no change needed.
- Mobile stack is natural document flow — screen readers read Terminal then Lettermatch in source order.

## Visual design

- **Thumbnail:** 44×44px, 9px border-radius, translucent dark background (`rgba(0,0,0,0.35)` with `backdrop-filter: blur(4px)`), border `rgba(255,255,255,0.1)`. Hover: border brightens to `#c9a76a`, scale(1.05). Uses the app's existing `AppMark` component at `size=32` (same glyph as dock).
- **Lock glyph on dock:** small 🔒 emoji (or equivalent inline SVG lock) at 10px, pinned bottom-right of the icon, on a `#2a2420` circular background. Reason for emoji: zero new asset deps, renders at consistent size across platforms. If the emoji variant breaks the house typography, swap to inline SVG in plan phase.
- **Tooltip:** `#1a1614` background, `#c9a76a` 1px border, `#f5ede0` text at 11px, small arrow pointing at the triggering element.
- **Motion:** rail fades in with windows on initial paint (`animation: fade-in 400ms` shared with existing windows). Tooltip opens with `opacity 0 → 1, translateY 4px → 0` over 120ms.

## Success criteria

1. On desktop first paint, the live Lettermatch window is unambiguously the most visually prominent surface after the Terminal.
2. A visitor can tell within 2 seconds which apps are live vs coming soon.
3. Clicking a coming-soon app anywhere (rail thumbnail or dock icon) gives consistent feedback — a tooltip, not a window.
4. Closing Lettermatch via red traffic-light still lets the visitor reopen it via its dock icon (no regression).
5. Mobile renders both live windows in a clean vertical stack with the dock still usable, no dragging or overflow.
6. No regression in Terminal signup flow, comment overlay (dev only), or existing keyboard focus cycling.

## Out of scope

- Changing any coming-soon app window contents.
- Changing the dock magnification behavior, pulse animation, or keyboard focus logic.
- Mobile gestures (swipe-to-dismiss, pull-to-refresh) — stack is plain scroll.
- Persisting which apps are staged across sessions.
- Re-orderable rail or user-defined stage set.
- Promoting a coming-soon app to "live" once it ships — that's a data-layer change in `content/apps.ts` that naturally flows through: a `comingSoon: false` flip moves it into staged/dock-live set.

## Open questions deferred to plan phase

- Exact copy for each coming-soon tooltip. Draft: "IssueAggregator · launching Q3", "hiRelay · launching Q3", "BuildMeThis · launching Q4". Confirm dates with `.impeccable.md` / content owner before implementation.
- Whether the rail should fade out and let mac-desktop go full-width when all three coming-soon apps eventually ship (future milestone).
- Which inline SVG to use for the lock glyph if emoji rendering turns out inconsistent.
