---
sketch: 001
name: dimmed-card-styles
question: "How do locked / coming-soon portfolio cards read clearly while keeping the hazard-tape titlebar bright?"
winner: null
tags: [portfolio, cards, dimmed, locked, hazard-tape]
---

# Sketch 001: Dimmed Card Styles

## Design Question

Current state darkens the whole window chrome via a brightness filter on `.win-chrome`. That drags the hazard tape and traffic-light colors down with it — everything reads muddy grey. Titlebar should stay **light / bright** and the **body** should carry the "locked" signal.

## How to View

```
open .planning/sketches/001-dimmed-card-styles/index.html
```

Use the top tab bar to switch between treatments. The **Compare all** tab puts one dimmed card per treatment in a 2x2 grid for direct side-by-side comparison.

## Variants

- **Current** — shipped baseline. Outer filter darkens everything. Shown for reference.
- **A · Body-only filter** — same filter values as today, scoped to `.win-body`. Titlebar + hazard tape + traffic lights at full color. Smallest diff.
- **B · Frosted glass** — backdrop-blur + cream scrim + faint noise on body. Premium "locked pane" feel. GPU-heavier; needs `@supports` fallback.
- **C · Blueprint paper** — body replaced with cream paper + faint grid + padlock watermark. Furthest from current look. Clearest "placeholder" story.
- **E · Scrim + 135° crosshatch ★** — light cream scrim + faint 135° hatch (same angle as hazard tape). No filter. Best coherence with the existing construction metaphor; body still legible.

## What to Look For

1. **Hazard tape punch** — in which variants does the yellow feel loud and alive?
2. **Traffic-light color** — red/yellow/green should remain fully saturated (not desaturated dots).
3. **Body legibility vs locked-ness** — is the "this is not shipped" signal clear without fully hiding content?
4. **Coherence with Lettermatch (live)** — the dimmed cards should feel *different in category*, not just *a darker version of* the live card.
5. **Motion cost** — tape animation should still be the most active part of the card.

## Notes

- The HTML sketch mirrors colors / shadows / tape animation from `app/globals.css` 1:1 so the comparison is faithful.
- Shimmer overlay is only shown in the Current variant — once we move away from the outer-filter approach, the shimmer fights the new body treatments and gets dropped.
- Prefers-reduced-motion is respected (tape, live-dot, shimmer all freeze).

## Next Step

Once a winner is picked, port the winning treatment into `app/globals.css:1132-1193` and (for variant A) add a `.win-body` wrapper in `components/Window.tsx:178`.
