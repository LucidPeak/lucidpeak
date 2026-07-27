# lucidpeak.co

Small-studio portfolio site. Mac-desktop-metaphor homepage with stacked app windows.

## Stack

- Next.js **16.2.4** (App Router) — breaking changes vs training data. Before writing Next APIs, read `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`). Heed deprecation notices.
- React **19.2.4**
- Tailwind **v4** (via `@tailwindcss/postcss`) — not v3. Config in `app/globals.css`, not `tailwind.config.*`.
- TypeScript strict. Path alias `@/*` → repo root.
- No test framework. No state lib. No UI kit.

## Commands

- `npm run dev` — dev server (port 3000)
- `npm run build` — prod build
- `npm run start` — serve prod build
- `npm run lint` — eslint (flat config, `eslint.config.mjs`)

Ask user before starting dev server — they usually have one running.

## Layout

- `app/page.tsx` — renders `<Portfolio />` + `<Footer />`
- `app/layout.tsx` — fonts (Geist Sans/Mono), metadata, injects `<CommentOverlay />` **only in dev**
- `app/api/comments/route.ts` — dev-only comment capture endpoint (writes to `.comments/`)
- `app/globals.css` — palette, mac-window classes (`.mac-screen`, `.mac-display`, `.mac-desktop`, `.win-chrome`, `.terminal-outside`), Tailwind v4 directives
- `components/` - `Portfolio`, `Window`, `WindowBody`, `TitleBar`, `TrafficLights`, `Dock`, `Terminal`, `CommentOverlay`
- `components/cards/` - per-app preview cards (`LettermatchCard`, `IssueAggregatorCard`, `LettermatchLivePreview`, `IssueAggregatorLivePreview`, `SecretCard`, `CodeTyper`)
- `components/app-icons/` - per-app svg icons
- `content/apps.ts` - single source of truth for the app roster (slug, accent, href, icon)
- `hooks/` - `useStickyDrag` (rubber-band window wobble; also exports imperative `startStickyDrag`), `useInViewport`

## Design rules (mandatory)

**Read `.impeccable.md` before any visual/copy/motion work.** Enforced rules:

- **Light-only theme.** `colorScheme: "only light"` in `layout.tsx`. No dark mode, no toggle.
- **No pure black, no pure white.** Cream paper palette in `globals.css`. Per-app accents in `content/apps.ts`.
- **Mac-window metaphor is the primary brand asset** — not a gimmick to strip.
- **House easing curve**: `cubic-bezier(0.22, 1, 0.36, 1)`. No bounce.
- **Anti-references**: no SaaS hero, no cyan-on-dark, no purple-blue gradients, no 3-up feature grids, no neon, no `border-left: 4px solid accent`.

## Conventions

- Client components: `"use client"` at top. Server components default.
- Keep components small; extract to `components/cards/` when a window gets its own visual.
- Window shapes/sizes baked into CSS, not runtime controls (dev shape controls were removed — see `30ebba4`, `982cf11`).
- Dimmed/non-focused windows: darkening filter on outer `.win-chrome` (see `c14db02`).

## Workflow context

- `.planning/sketches/` holds committed design sketches. (GSD tooling is retired - don't run `gsd-*` commands.)
- `.comments/` holds dev CommentOverlay output — user leaves review comments there for you to pick up.
- `docs/superpowers/plans/` holds active implementation plans.
- Before claiming a UI change works, the user usually wants visual confirmation — say so if you can't verify.

## Gotchas

- Next 16 removed/renamed things. When an API feels off, check `node_modules/next/dist/docs/` — **don't** rely on memory.
- Tailwind v4 uses CSS-based config — don't create `tailwind.config.ts`.
- `CommentOverlay` only mounts in dev; don't add prod logic expecting it.
- Fonts are Geist via `next/font/google`. `.impeccable.md` flags this as edge-of-monoculture — pick distinctive faces if adding display type.
