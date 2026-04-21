# Signup as a Terminal App — Design Spec

**Date:** 2026-04-21
**Status:** Approved for planning
**Scope:** Replace the current full-width `Signup` section with a Terminal-styled window that lives inside the macOS-metaphor desktop, plus a quiet one-liner footer fallback.

## Intent

The current signup is a cream pill + Join button sitting in its own section below the Portfolio. It reads as a SaaS CTA — the exact pattern the brand context (`.impeccable.md`) tells us to refuse.

The signup becomes a fifth "app" on the studio desktop: a small terminal window with a command-line subscribe prompt. The preview is the pitch — visitors see a working terminal, type their email like a command, and the act of subscribing demonstrates the studio's taste instead of asking for it.

A small text fallback stays near the footer for visitors who miss the terminal or can't use it.

## Architecture & placement

**New component:** `components/Terminal.tsx` — the interactive terminal body. Rendered inside the existing window chrome, not as a replacement for it.

**Integration with `WindowBody.tsx`:** the existing `WindowBody` wraps a `CardVisual` switch plus a standard layout (AppMark, badge, title, pitch, CTA link). Terminal doesn't fit that mold — it needs to fill the window body directly. `WindowBody` gains a single early-return branch: if `app.slug === "terminal"`, render `<Terminal />` and skip the standard card layout entirely. No other apps are affected.

**App registry (`content/apps.ts`):**
- New fifth entry with slug `terminal`, accent `#1c1b19` (ink).
- `comingSoon: false`.
- The `App` type gains optional `width` and `height` fields. Only Terminal uses them. Other apps fall back to the existing `WIN_W = 270` / `WIN_H = 240`.
- The `App` type's `pitch` field is currently required. Terminal has no meaningful `pitch`. Make `pitch` optional so Terminal can omit it, and make `tagline` stay optional (already is). Since `WindowBody` short-circuits for Terminal, the pitch wouldn't render anyway, but the type should not force a meaningless string.
- `mark` field — Terminal uses a single `›` (one character) for consistency with `AppMark`'s existing single-letter layout at `fontSize: size * 0.42`. The dock-level glyph refinement (e.g., swapping to `›_` two-char treatment) is addressed in the Visual spec section below via a custom dock rendering path; see that section for the exception.

**Page-level layout (`app/page.tsx`):**
- `Hero` → `Portfolio` (now contains Terminal among its windows) → shrunk signup hint (replaces current `<Signup />`) → `Footer`.
- The fifth dock icon lives in the existing `Dock` component — no dock-level changes beyond consuming the new app entry.

**Window chrome:**
- Outer frame uses the existing `mac-screen` styling (cream, traffic lights, title "Terminal"). Matches siblings.
- Inner content area is a dark terminal surface (`#1c1b19`). The metaphor is "a terminal running inside a window on the Mac", not "the whole window is dark".

**Window behavior (reuses `Window.tsx`):**
- Opens by default on page load.
- Positioned at `x = desktopRect.width - 320 - 24`, `y = 28` (upper-right, not randomized).
- Starting z-index lower than the other four apps so the hero still belongs to the project windows.
- Draggable, focusable, z-ordered, closeable, minimizable, maximizable — identical to siblings.

**Tradeoff accepted:** the fifth dock icon makes the dock slightly denser on narrow viewports. Cost is small; `Dock.tsx` already handles N icons.

## Interaction state machine

Terminal content has three zones, top to bottom:

1. **Header** (static, dim): `lucidpeak — studio terminal` then `type and press return`.
2. **Demo line** (static, always present): `$ subscribe --email luna@hello.com` then `✓ subscribed. see you soon.`
3. **Live prompt** (interactive): `$ subscribe --email ▍` where `▍` is the focused input with blinking caret.

### States

Single state variable, same pattern as current `Signup.tsx`.

| State | What the prompt looks like | Input behavior |
|---|---|---|
| `idle` | `$ subscribe --email ▍` | Empty input, caret blinking, focused when window is focused |
| `typing` | `$ subscribe --email you@h▍` | Shows entered text, caret right of text |
| `submitting` | Last line: `…` dim pulse under the submitted command | Input disabled |
| `success` | Submitted command becomes history. Green line: `✓ subscribed. see you soon.` New `$ ▍` prompt below. | Fresh prompt is re-enabled; no second submission required |
| `error` | Red line: `err: not a valid email` (or network variant) under the attempt. Prompt repopulated with what the user typed. | Input focused, text pre-selected |

### Transitions

- `idle → typing`: any keystroke.
- `typing → submitting`: Enter with non-empty input.
- `submitting → success`: POST to `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` resolves with 2xx; or endpoint missing (treated as success, matches current `Signup.tsx`).
- `submitting → error`: POST fails / non-2xx / timeout (10s), OR client-side email validation fails before POST.
- `error → typing`: any keystroke.

### Window lifecycle edges

- **Minimize or close mid-submit**: request continues. Result updates in-place (hidden). Next reopen shows the history line already there.
- **Reopen after close**: session history lines persist in `Portfolio`-level state, not lost on close.
- **Unfocus**: caret stops blinking. Click anywhere in the terminal body refocuses the input.

### Keyboard-only path

Tab to dock → Arrow/Tab across icons → Enter on Terminal icon → focuses window → Tab to input → type → Return submits. Esc blurs input, window stays open.

### History convention

Each successful submission locks in as a history pair (`$ subscribe --email …` + `✓ subscribed. see you soon.`) above a fresh prompt. The demo line establishes this convention on page load — submissions join the same history, reinforcing that this is a real terminal, not a disguised form.

## Visual spec

### Dock icon

- 32×32 dark tile `#1c1b19`, 26% rounded corners (matches existing `AppMark`).
- White `›_` glyph, `ui-monospace`. Two characters, so `AppMark`'s single-letter layout (fontSize = size * 0.42) doesn't fit — `›_` would clip or look cramped.
- **Implementation note:** `AppMark` renders whatever is in `app.mark`. To avoid sprinkling conditional logic into `AppMark`, `Dock.tsx` branches on `app.slug === "terminal"` and renders a small dedicated `TerminalMark` component (dark tile + `›_` glyph sized to fit). `app.mark` stays `›` as a fallback but is not used for Terminal in the dock.
- Active-indicator dot under the icon behaves identically to other apps.

### Window dimensions

- 320 × 200 (wider than default to fit a full email line without wrap).
- Requires optional `width` / `height` fields on the `App` type in `content/apps.ts`; only Terminal uses them.

### Inner terminal surface

- Background `#1c1b19`.
- Padding 12px.
- Typography: `ui-monospace, "SF Mono", Menlo, monospace`, 12.5px, line-height 1.55.

### Color tokens

| Token | Color | Usage |
|---|---|---|
| `term.bg` | `#1c1b19` | Surface |
| `term.text` | `#e9e5d8` | Base text |
| `term.dim` | `#a7a196` | Header, hints (lifted from `#8a8578` to pass AA) |
| `term.prompt` | `#8ba97a` | `$`, prompt char, success |
| `term.flag` | `#e5a853` | `--email` (pulls Lettermatch gold into the palette) |
| `term.err` | `#ef6f8c` | Error line (pulls BuildMeThis rose) |
| `term.caret` | `#e9e5d8` | 7×16 block caret, blink `1s steps(2) infinite` |

Accent colors are pulled from existing app accents so the terminal reads as part of the studio palette rather than a foreign dark-mode island.

### Exact copy (single source of truth)

```
lucidpeak — studio terminal
type and press return

$ subscribe --email luna@hello.com
✓ subscribed. see you soon.

$ subscribe --email ▍
```

- Top two lines in `term.dim`.
- Demo history block static, always present.
- Live prompt line is the only interactive surface.

**Success line:** `✓ subscribed. see you soon.`
**Email-invalid error:** `err: not a valid email`
**Network error:** `err: couldn't reach the server — try again?`
**In-flight placeholder:** single `…` line in `term.dim`.

### Shrunk signup hint (replaces the current `Signup.tsx` section)

Centered, ~56px total block where the old Signup section lived.

```
FOLLOW ALONG
or drop a line: <studio-email>
```

- Label: 11px, uppercase, tracked `0.2em`, `zinc-500`.
- Line: 13px, `zinc-700`, underline on hover. Rendered as `<a href="mailto:<studio-email>">`.
- No pill, no button.
- **Placeholder to confirm during implementation:** `<studio-email>` is shown as `hello@lucidpeak.co` in mockups, but the real inbox address is not yet confirmed for this site. The implementation plan should ask or check `.impeccable.md` / repo notes before committing a mailto.

### Known cosmetic concern (non-blocking)

The `›_` dock glyph reads cleanly at 32px but may feel cute at smaller sizes. If/when a mobile tightening pass lands, consider swapping to a plain `T` on the same dark tile.

## Motion spec

House curve: `cubic-bezier(0.22, 1, 0.36, 1)` for all motion except the caret blink. No bounce.

### Caret

- 7×16 block in `term.caret`, `animation: blink 1s steps(2) infinite`.
- Paused during `submitting` (replaced by the `…` dot pulse) and solid during `success`.

### Stage reveal on window open (page load)

- Window fades + slides in from `y + 8px` over 420ms.
- Content stages inside:
  - `0ms` — header lines visible.
  - `120ms` — demo line `$ subscribe --email luna@hello.com` reveals with 80ms per-chunk type-in (not per-character; feels like "this was just run").
  - `360ms` — demo success line slides in from `y + 4px`, 220ms.
  - `560ms` — live prompt appears, caret starts blinking.
- Total under 800ms. The stage tells the story "someone just subscribed — now it's your turn."

### Submit

- `…` line fades in over 120ms below the submitted command, `term.dim`.
- Three-dot sequence: `opacity 0.4 → 1 → 0.4` across 900ms, one cycle per 300ms dot.
- Real network response replaces the `…`.

### Success

- `…` line collapses (height → 0 over 160ms).
- Submitted command locks into history: text becomes un-editable, re-colored to `term.text`, no caret.
- Green success line slides in from `y + 4px`, 220ms.
- One blank line, then a fresh `$ subscribe --email ▍` prompt fades in over 180ms. Caret begins blinking.

### Error

- `…` collapses (if it appeared; invalid-email branch skips this).
- Red error line slides in from `y + 4px`, 220ms.
- Terminal container single gentle horizontal shake: `translateX(0 → -3px → 3px → 0)` over 180ms, one pass.
- Input re-focuses with submitted text pre-selected.

### Close / minimize

Reuses `Window.tsx` existing motion. No new work.

### Dock icon feedback

- Dock click when window closed: existing `active:scale-95` on the button; window fades/slides in per stage reveal.
- When minimized and a `success` just arrived while hidden: dock icon gets one 1.5s-ease breath — `box-shadow` pulses to a 2px soft green ring and back, once. Does not repeat.

### Reduced motion (`prefers-reduced-motion: reduce`)

- Caret solid, no blink.
- Stage reveal instant — all lines visible on first paint.
- Submit/success/error: no slide, no shake. Text appears.
- **Window open/close motion:** `Window.tsx` currently sets its own `transition` strings inline without a `prefers-reduced-motion` branch. `globals.css` only covers specific animation classes (`.code-cursor`, `.fade-in-up`, `.live-dot`). Terminal inherits the same behavior. Adding a reduced-motion branch to `Window.tsx` itself is a pre-existing gap, not introduced by this spec. The implementation plan may opt to guard Terminal-specific animations via a `prefers-reduced-motion` media query inside `Terminal.tsx` or via a new class in `globals.css`, but widening the fix to `Window.tsx` is out of scope here.

### Out of scope

No typing SFX. No confetti. No scan-lines, CRT flicker, Matrix green-on-black. No looping demo replay.

## Accessibility

### Semantics

The terminal chrome is decorative. Functional payload is a standard subscribe form.

```jsx
<form aria-label="Subscribe to updates">
  <label htmlFor="sub-email" className="sr-only">Email address</label>
  <span aria-hidden="true">$ subscribe --email </span>
  <input
    id="sub-email"
    type="email"
    required
    autoComplete="email"
    inputMode="email"
    spellCheck={false}
    aria-describedby="sub-hint"
  />
  <span id="sub-hint" className="sr-only">Press Return to subscribe.</span>
  <button type="submit" className="sr-only">Subscribe</button>
</form>
```

- Demo history block wraps in `aria-hidden="true"` — purely cosmetic.
- Status output wraps in `<div role="status" aria-live="polite">` so each state change announces once.
- The hidden submit button exists so SR users hear a submit affordance and can trigger Enter identically to sighted users.

### Window-level semantics

`Window.tsx` currently renders its wrapper as `role="dialog"` with `aria-label={app.name}`. This is a pre-existing decision — technically a mismatch for non-modal floating windows, but not introduced by this spec. Terminal inherits the same treatment via the existing `Window` component. Changing the `role` repo-wide is out of scope for this spec. Flagged in open questions; if it's taken up, it happens in a separate pass across all app windows, not just Terminal.

### Keyboard (end-to-end)

1. Tab through page reaches the dock.
2. Arrow or Tab across dock icons.
3. Enter or Space on the Terminal icon opens/focuses the window.
4. Tab from there reaches the email input.
5. Return submits. Esc blurs input, window stays open. Red traffic light closes it.
6. Focus indicator on the email input: 2px inset ring on the prompt line in `term.caret` color. Caret alone is motion-dependent and insufficient for AA.
7. Clicking anywhere inside the terminal body also focuses the input (convenience, not a11y substitute).

### Contrast

- `term.text` (`#e9e5d8`) on `term.bg` (`#1c1b19`): AAA.
- `term.prompt` (`#8ba97a`) on bg: AA.
- `term.flag` (`#e5a853`) on bg: AA comfortably.
- `term.err` (`#ef6f8c`) on bg: AA.
- `term.dim` (`#a7a196`) on bg: AA (lifted from `#8a8578`, which was borderline).

### Error announcement

On state flip to `error`, live region text is a full sentence, not the shell shorthand.

- Invalid email: `"Not a valid email address."`
- Network failure: `"Couldn't reach the server. Try again."`

Visual stays lowercase shell-style (`err: not a valid email`); SR hears plain English. Intentional divergence.

### Browser/mobile help

- `autocomplete="email"` for password managers, iOS autofill.
- `inputMode="email"` for correct mobile soft keyboard.
- `spellCheck={false}` — emails aren't spell-checkable.

### Touch targets

- Dock icon 32px — existing pattern, exceeds 24px AA minimum.
- Effective input touch area is the full terminal interior (click-to-focus).

### Deliberate non-goals

- No high-contrast fallback palette in v1. Warm dark surface already passes AA; a monotone alt would kill brand.

## Failure modes & edge cases

### Client-side validation (runs before POST)

- Missing `@` or empty → error, no network call. Matches current `Signup.tsx`.
- Leading/trailing whitespace trimmed before validation.
- Max length 254 chars (RFC 5321); longer is rejected with the same copy.

### Network failures

- POST throws / non-2xx / timeout (10s) → `error` with network copy: `err: couldn't reach the server — try again?`.
- SR text: `"Couldn't reach the server. Try again."`
- **Missing `NEXT_PUBLIC_NEWSLETTER_ENDPOINT`**: treat as success. Matches existing `Signup.tsx` dev/preview contract.

### Double-submit

Enter during `submitting` is a no-op. Input is disabled. No queued submit.

### Typing during submit

Input is disabled; keystrokes don't mutate state. No timing race.

### Close or minimize mid-submit

- Request is not aborted.
- On resolve, state updates in the hidden window. Reopening shows the line already there.
- Live region does not fire while window is hidden — correct behavior for SRs.
- Minimized success fires the dock icon single-breath animation (motion spec).

### Rapid reopen / resubmit

- Each submission appends a history pair.
- No cap in v1. When history > ~8 lines, terminal body gains `overflow-y: auto` and pins to latest.

### "Already subscribed" from backend

- Any 2xx is coerced to success. No distinction shown in v1.
- 409 specifically (if the endpoint returns it) is also coerced to success. Spec-documented; not user-visible.

### Long email address

- Input has `overflow: hidden`; browser native horizontal scroll follows the caret. No custom work. Applies to paste as well.

### Paste

- Standard `input` events flow through the state machine. `type="email"` flattens multi-line paste to the first line — acceptable native behavior.

### Mobile viewport

- `mac-desktop` is `min(66vh, 600px)` with `minHeight: 440`. On a 375px phone: ~290–440px tall.
- Terminal pinned top-right at 320×200 fits; the four random-placed windows already fit in the same area.
- Soft keyboard on focus covers the bottom ~40%; Terminal's top-right pinning keeps the prompt visible. Pinning does double duty: discovery + keyboard avoidance.
- Five dock icons is fine at mobile widths; `Dock.tsx` doesn't cap N.

### z-order on load

- Terminal starts at the lowest z. Project windows own the hero. Clicking the dock icon raises Terminal via existing focus logic.
- Pinned top-right means it stays visible beside/behind siblings even without interaction.

### SSR / hydration

- `"use client"` component.
- Demo line content is static — no hydration mismatch from caret blink or live region.

### Footer fallback

- If JS fails entirely (disabled, hydration crash), the shrunk `or drop a line: <studio-email>` footer line is plain HTML. Signup is never lost.

### Explicitly out of v1 scope

- Double-opt-in confirmation UX (provider-side).
- Resubscribe / unsubscribe flow.
- i18n of terminal copy.
- Analytics events on submit.

### Open questions (flagged, non-blocking)

- Sub-32px `›_` dock glyph legibility — revisit during any mobile tightening pass.
- Whether to surface "already subscribed" explicitly if the backend starts distinguishing it.
- Studio fallback email address for the footer `mailto:` — `hello@lucidpeak.co` is shown in mockups but not confirmed as the real inbox. Implementation plan should confirm before shipping.
- Pre-existing `Window.tsx` a11y treatment — currently `role="dialog"` with `aria-label`; arguably should be `role="region"` for non-modal windows. Not fixed by this spec.
- Pre-existing `Window.tsx` reduced-motion treatment — open/close transitions are unguarded. Not fixed by this spec; Terminal-specific animations will respect the media query regardless.
