# Newsletter Backend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing Terminal signup UI to Resend so visitors land on a real list and get a welcome email, then deploy the site to Vercel on the `lucidpeak.co` domain.

**Architecture:** Tiny Next.js route handler at `/api/subscribe` runs server-side on Vercel, calls Resend twice (contacts.create + emails.send) with a server-only API key, returns JSON to Terminal. Terminal adds a hidden honeypot field and swaps its POST target from the stale `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` env to the new same-origin endpoint. Everything list-related (storage, deliverability, unsubscribe, future Broadcasts) lives in Resend.

**Tech Stack:** Next.js 16.2.4 App Router (Node runtime), React 19.2.4, TypeScript 5, Resend Node SDK (`resend`), Vercel for deploy, Cloudflare for DNS.

---

## Notes for the executing engineer

**About this codebase (read before writing any Next.js API):**
- Next.js is **16.2.4**. This is newer than your training data. Before touching route handlers, read `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers-and-middleware.mdx` (path may vary slightly — look under `01-app` for route handler docs). Heed any deprecation notes. In particular, the Next 16 route handler signature uses a standard `Request`/`NextRequest` and returns a `Response`/`NextResponse` — no big changes expected, but verify.
- **No test framework is installed in this repo.** This plan does not add one. Verification per task is: type-check with `npx tsc --noEmit`, lint with `npm run lint`, and manual dev-server checks (`npm run dev` — note the user runs on port 3001 via `PORT=3001 npm run dev`). Do NOT invent a test framework mid-flight.
- **Dev server assumed running on port 3001** throughout (user's convention). All manual test URLs use `http://localhost:3001`.
- **Ask before running the dev server** if it isn't already running (user's `CLAUDE.md` rule).
- Commit after every task using the provided message. One task = one commit.

**Spec:** `docs/superpowers/specs/2026-04-23-newsletter-backend-design.md` is the source of truth. Anything this plan doesn't restate, check the spec.

**Secrets:** the user has saved `RESEND_API_KEY` (`re_...`) and `RESEND_AUDIENCE_ID` (UUID) outside the repo. When a task says "put these in `.env.local`", paste from the user's stash. Never commit `.env.local`.

---

## File Structure

**Create:**
- `lib/resend.ts` — single `Resend` SDK instance reading `RESEND_API_KEY` at module load.
- `lib/welcome-email.ts` — `WELCOME_SUBJECT` and `WELCOME_BODY` exported constants (plain text).
- `app/api/subscribe/route.ts` — POST handler. Validates, honeypot checks, calls Resend twice, returns JSON.

**Modify:**
- `package.json` — adds `resend` to dependencies (via `npm install resend`).
- `components/Terminal.tsx` — replaces the `process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT` block with a hard-coded POST to `/api/subscribe`, and includes a `website` honeypot value in the body. The form gets a visually-hidden `<input name="website" …>` the user never sees.

**No changes:**
- `app/page.tsx`, `app/layout.tsx`, `components/Portfolio.tsx`, `components/Dock.tsx`, `components/WindowBody.tsx`, `content/apps.ts`, `app/globals.css` — none of these touch the signup endpoint.
- No changes to existing state machine, motion, a11y, or visuals in `Terminal.tsx`. Only the submit target + the honeypot input are edited.

Each responsibility is isolated: SDK setup in `lib/resend.ts`, copy in `lib/welcome-email.ts`, server logic in `app/api/subscribe/route.ts`, client wire-up in `Terminal.tsx`.

---

## Task 1 — Install the Resend SDK

**Files:**
- Modify: `package.json` (via npm), `package-lock.json`

- [ ] **Step 1: Install.**

Run: `npm install resend`
Expected: `package.json` gains `"resend": "^<version>"` under `dependencies`. `package-lock.json` updates.

- [ ] **Step 2: Type-check.**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit.**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add resend SDK"
```

---

## Task 2 — `lib/resend.ts` (SDK singleton)

**Files:**
- Create: `lib/resend.ts`

- [ ] **Step 1: Confirm the `lib/` directory.**

Run: `ls lib/ 2>/dev/null || echo "no lib dir"`
If the directory doesn't exist, create it: `mkdir lib`
Expected: directory exists before writing the file.

- [ ] **Step 2: Create `lib/resend.ts`.**

Full file contents:

```ts
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  // Module-load failure is surfaced at the first API call. Throwing here would
  // crash any dev hot-reload that happens before env vars are wired up.
  // Route handler checks this before calling Resend.
  console.warn("RESEND_API_KEY is not set — /api/subscribe will return 500.");
}

export const resend = new Resend(apiKey ?? "missing");
```

- [ ] **Step 3: Type-check + lint.**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 4: Commit.**

```bash
git add lib/resend.ts
git commit -m "feat(lib): add resend SDK singleton"
```

---

## Task 3 — `lib/welcome-email.ts` (email template constants)

**Files:**
- Create: `lib/welcome-email.ts`

- [ ] **Step 1: Create `lib/welcome-email.ts`.**

Full file contents:

```ts
export const WELCOME_SUBJECT = "welcome to lucidpeak";

export const WELCOME_BODY = `hey —

thanks for subscribing.

lucidpeak is a studio that ships small, considered apps.
when there's something new (a launch, a build log, a tool
that might be useful), i'll send a short note here.

no hype, no pestering. reply if you want to chat.

— nikita
lucidpeak.co
`;

export const WELCOME_FROM = "Lucidpeak <hello@mail.lucidpeak.co>";
export const WELCOME_REPLY_TO = "lucidpeak@proton.me";
```

- [ ] **Step 2: Type-check + lint.**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 3: Commit.**

```bash
git add lib/welcome-email.ts
git commit -m "feat(lib): add welcome email subject/body/from constants"
```

---

## Task 4 — `app/api/subscribe/route.ts` (POST handler)

**Files:**
- Create: `app/api/subscribe/route.ts`

- [ ] **Step 1: Create the directory.**

Run: `mkdir -p app/api/subscribe`
Expected: directory exists.

- [ ] **Step 2: Create `app/api/subscribe/route.ts`.**

Full file contents:

```ts
import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import {
  WELCOME_SUBJECT,
  WELCOME_BODY,
  WELCOME_FROM,
  WELCOME_REPLY_TO,
} from "@/lib/welcome-email";

export const runtime = "nodejs";

type Body = {
  email?: unknown;
  website?: unknown;
};

function isValidEmail(value: string) {
  if (value.length === 0 || value.length > 254) return false;
  if (!value.includes("@")) return false;
  return true;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  // Honeypot: silently accept so bots don't retune.
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true, bot: true }, { status: 200 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "invalid_email" },
      { status: 400 },
    );
  }

  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) {
    console.error("RESEND_AUDIENCE_ID is not set");
    return NextResponse.json(
      { ok: false, error: "server" },
      { status: 500 },
    );
  }

  try {
    await resend.contacts.create({
      email,
      audienceId,
      unsubscribed: false,
    });

    await resend.emails.send({
      from: WELCOME_FROM,
      to: email,
      replyTo: WELCOME_REPLY_TO,
      subject: WELCOME_SUBJECT,
      text: WELCOME_BODY,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("subscribe route error:", err);
    return NextResponse.json(
      { ok: false, error: "server" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 3: Verify the `@/` path alias resolves.**

Run: `grep -n '"@/\*"' tsconfig.json`
Expected: shows `"@/*": ["./*"]` or equivalent. If it's missing, stop and read `tsconfig.json`. The repo already uses `@/` imports elsewhere (see `components/Portfolio.tsx`), so it should be present.

- [ ] **Step 4: Type-check + lint.**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

If the Resend SDK types complain about `contacts.create` or `emails.send` parameter shapes, open `node_modules/resend/dist/` to confirm the current type signatures. The SDK evolves — `replyTo` vs `reply_to`, `audienceId` vs `audience_id`, may have changed. Match what the installed SDK expects. If you edit, keep the Node-style camelCase on the outer object (both are supported historically, but camelCase is documented for the Node SDK).

- [ ] **Step 5: Commit.**

```bash
git add app/api/subscribe/route.ts
git commit -m "feat(api): POST /api/subscribe — honeypot, validate, create contact, send welcome"
```

---

## Task 5 — Wire `Terminal.tsx` to the new endpoint

**Files:**
- Modify: `components/Terminal.tsx`

The Terminal currently POSTs to `process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT` (lines 106–121). That env var is unused and should be removed. The new endpoint is a hard-coded same-origin path. A hidden honeypot input gets added to the form; its value is read at submit time and included in the POST body.

- [ ] **Step 1: Replace the endpoint block in `onSubmit`.**

In `components/Terminal.tsx`, locate the `onSubmit` handler (around line 97). The existing `try { const endpoint = process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT; if (endpoint) { ... } } ...` block is the submit request.

Replace the block from `setStatus("submitting");` (line 104) through the end of the outer `try`/`catch` that calls the endpoint (line 121 — the `}` closing `if (endpoint)`) with a single always-on request. The full replacement region — from `setStatus("submitting");` to the closing brace before `setHistory((prev) => ...)` — becomes:

```tsx
    setStatus("submitting");
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);
      try {
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: value, website: honeypotRef.current?.value ?? "" }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("request failed");
      } finally {
        clearTimeout(timeoutId);
      }
```

Note: the surrounding outer `try { ... } catch { appendErrorHistory(...) }` stays — only the inner "if endpoint / else no-op" branching is gone. After the `finally { clearTimeout(timeoutId); }`, the existing `setHistory((prev) => [..., { kind: "submission", email: value }, { kind: "success" }])` + `setLastAnnouncement` + `setEmail("")` + `setStatus("idle")` + `window.dispatchEvent(...)` all stay unchanged.

- [ ] **Step 2: Add a ref for the honeypot input.**

At the top of the `Terminal()` component body (after the other `useRef` calls around line 35 — specifically after `const inputRef = useRef<HTMLInputElement | null>(null);`), add:

```tsx
  const honeypotRef = useRef<HTMLInputElement | null>(null);
```

- [ ] **Step 3: Render the honeypot input inside the form.**

Inside the `<form onSubmit={onSubmit} aria-label="Subscribe to updates">` (around line 182), directly after the opening `<form>` tag and before the `<label htmlFor="sub-email" className="sr-only">Email address</label>`, add:

```tsx
          <input
            ref={honeypotRef}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-9999px",
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: "none",
            }}
          />
```

The honeypot is visually offscreen, keyboard-unreachable (`tabIndex={-1}`), screen-reader-hidden (`aria-hidden`), and excluded from autocomplete. Real users never interact with it.

- [ ] **Step 4: Type-check + lint.**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0. TypeScript should be happy with the new ref type (`HTMLInputElement | null`, same as `inputRef`).

- [ ] **Step 5: Commit.**

```bash
git add components/Terminal.tsx
git commit -m "feat(terminal): POST to /api/subscribe with honeypot, drop NEXT_PUBLIC_NEWSLETTER_ENDPOINT"
```

---

## Task 6 — Local end-to-end test

**Files:** (none modified — verifying end-to-end)

- [ ] **Step 1: Wire env vars for local dev.**

Ask the user for the `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` values they saved. Write them into `.env.local` at the repo root:

```
RESEND_API_KEY=re_<value_from_user>
RESEND_AUDIENCE_ID=<uuid_from_user>
```

Confirm `.env.local` is in `.gitignore` (it is — `.env*` is ignored). Do NOT commit this file.

- [ ] **Step 2: Start (or restart) the dev server.**

Ask the user whether the dev server is already running on port 3001. If not:

Run: `PORT=3001 npm run dev`
Expected: `✓ Ready in <ms>ms` + `Local: http://localhost:3001`.

Keep this running in the background. If it was already running, restart it so `.env.local` reloads.

- [ ] **Step 3: Happy-path test.**

Open `http://localhost:3001` in a browser. Click the Terminal window to focus. Click inside the prompt line to focus the input. Type your real email (one you can check), press Return.

Expected:
- Terminal shows the submitted command as history + green `✓ subscribed. see you soon.`
- Fresh prompt appears below with an empty input.
- Welcome email lands in your inbox within ~10 seconds. Subject: `welcome to lucidpeak`. From: `Lucidpeak <hello@mail.lucidpeak.co>`. Reply-To: `lucidpeak@proton.me`.
- In the Resend dashboard → Audience → `General`, the email is listed as a new contact.

If the welcome email doesn't arrive, check Resend → Logs for the send attempt and its status (delivered, bounced, etc.).

- [ ] **Step 4: Invalid email test.**

In the Terminal, type `nope` (no `@`) and press Return.
Expected: red line `err: not a valid email`. No contact created in Resend. The request still happens (server validates too), so check the Network tab — response should be `400`.

- [ ] **Step 5: Idempotency test.**

Submit the same valid email again.
Expected: same green success visual. No "already subscribed" error. In Resend → Audience → `General`, contact count stays at 1 (Resend dedups on email).

- [ ] **Step 6: Honeypot test.**

Open devtools console on `http://localhost:3001`. Run:

```js
document.querySelector('input[name="website"]').value = 'bot';
document.querySelector('input[type="email"]').value = 'bot-test@example.com';
document.querySelector('form[aria-label="Subscribe to updates"]').requestSubmit();
```

Expected: visual success (history line + fresh prompt). **No contact created** in Resend for `bot-test@example.com` — confirm via Resend → Audience. The honeypot branch returned 200 but skipped the Resend calls.

- [ ] **Step 7: Server-error simulation.**

Temporarily corrupt the API key: in `.env.local`, change `RESEND_API_KEY=re_broken`. Restart the dev server. Submit a valid email.

Expected: red line `err: couldn't reach the server — try again?`. In the dev server's stdout, an error line from the route handler (`subscribe route error: ...`).

Restore the real key. Restart. Confirm the happy path works again.

- [ ] **Step 8: Report results to the user.**

Summarize: "All 5 tests pass: happy path, invalid email, idempotency, honeypot, server error. Welcome email received. Ready to deploy."

If any test failed, stop and debug before deploying. Common causes:
- Env var not loaded — restart dev server after editing `.env.local`.
- `@/lib/...` import errors — confirm `tsconfig.json` has the `@/*` path alias.
- Resend SDK parameter name mismatch — check `node_modules/resend/dist/` types for current shape.

- [ ] **Step 9: No commit — this task is verification only.**

---

## Task 7 — Deploy to Vercel

**Files:** (none modified — external service setup)

This task is manual work in the Vercel dashboard. The executing engineer guides the user through it step by step and verifies at each stage.

- [ ] **Step 1: Confirm GitHub remote.**

Run: `git remote -v`
Expected: an `origin` pointing at a GitHub repo. If not, stop and ask the user to push the repo to GitHub first — Vercel needs a Git provider hookup.

- [ ] **Step 2: Confirm the working tree is clean and the latest commits are pushed.**

Run: `git status && git log origin/main..HEAD --oneline`
Expected: `working tree clean`, and `git log` is empty (no unpushed commits). If unpushed commits exist, ask the user before pushing: `git push origin main`.

- [ ] **Step 3: User creates the Vercel project.**

Walk the user through:
1. Go to https://vercel.com/new.
2. Import the GitHub repo for `lucidpeak.co`.
3. Framework preset: should auto-detect **Next.js**. Leave defaults for Root Directory, Build Command, Output Directory.
4. Click **Environment Variables** → add two entries, both applied to **Production**, **Preview**, and **Development**:
   - `RESEND_API_KEY` = the `re_...` value
   - `RESEND_AUDIENCE_ID` = the UUID
5. Click **Deploy**.
6. Wait for the first build to complete (~1–2 min).

- [ ] **Step 4: Verify the preview URL works.**

Ask the user for the assigned `*.vercel.app` URL. Open it. Run the happy-path test again (Task 6 Step 3) — submit a valid test email, confirm welcome email lands + contact appears in Resend.

- [ ] **Step 5: No commit — deployment doesn't produce a local diff.**

If any follow-up fix was needed (e.g. an env var typo), the user fixes it in the Vercel dashboard and redeploys via the Vercel UI. No code changes.

---

## Task 8 — Attach custom domain `lucidpeak.co`

**Files:** (none modified — DNS work)

- [ ] **Step 1: Vercel side.**

In the Vercel project → **Settings** → **Domains** → **Add Domain**. Enter `lucidpeak.co`. Vercel displays DNS instructions:
- For the apex `lucidpeak.co`: either an A record pointing at Vercel's IP (e.g. `76.76.21.21`) OR a CNAME flattening (Cloudflare supports CNAME on apex via "CNAME flattening"; the instructions will show the target — typically `cname.vercel-dns.com`).
- For `www.lucidpeak.co`: a CNAME pointing at `cname.vercel-dns.com`.

Copy both.

- [ ] **Step 2: Cloudflare side — apex record.**

Cloudflare dashboard → select `lucidpeak.co` zone → DNS → Records → **Add record**.

If Vercel asked for an A record:
- Type: `A`
- Name: `@` (or leave blank; Cloudflare writes it as the apex)
- IPv4 address: the IP Vercel provided
- Proxy status: **DNS only** (grey cloud) — Vercel needs direct DNS, not Cloudflare proxy.
- TTL: Auto
- Save.

If Vercel asked for a CNAME at the apex (CNAME flattening):
- Type: `CNAME`
- Name: `@`
- Target: `cname.vercel-dns.com`
- Proxy status: **DNS only**
- TTL: Auto
- Save.

- [ ] **Step 3: Cloudflare side — `www` record.**

Add record:
- Type: `CNAME`
- Name: `www`
- Target: `cname.vercel-dns.com`
- Proxy status: **DNS only**
- TTL: Auto
- Save.

- [ ] **Step 4: Wait for Vercel's green check.**

Back in Vercel → Domains. Refresh. Both `lucidpeak.co` and `www.lucidpeak.co` should show green "Valid Configuration" within 1–5 min. If red after 5 min, verify in a terminal:

```bash
dig lucidpeak.co +short
dig www.lucidpeak.co +short
```

Both should resolve to Vercel's IP / hostname. If empty, records are wrong or still propagating.

- [ ] **Step 5: End-to-end on the real domain.**

Open `https://lucidpeak.co`. Run the happy-path test one more time (valid email → ✓ subscribed → welcome email in inbox → contact in Resend). This is the final sign-off.

- [ ] **Step 6: No commit — DNS changes don't live in git.**

---

## Task 9 — Cleanup + final report

**Files:**
- Possibly: `.env.local` (delete the test line from server-error test, if not already reverted)

- [ ] **Step 1: Final sanity pass.**

Run:
```bash
git status
npm run lint
npx tsc --noEmit
npm run build
```

Expected:
- `git status`: clean working tree (or only `.env.local` untracked).
- Lint: 0 errors.
- Type-check: 0 errors.
- Build: succeeds without warnings beyond usual Next.js info.

- [ ] **Step 2: Commit any trailing fixups.**

If the build surfaced a warning you fixed, commit with a descriptive message. Otherwise skip.

- [ ] **Step 3: Announce completion to the user.**

Summarize what landed:
- `/api/subscribe` live on `lucidpeak.co` accepting POSTs.
- Terminal submits to the new endpoint + honeypot wired.
- Welcome email fires on every valid signup.
- Vercel deploy attached to the custom domain with HTTPS.
- Resend handles the list; future Broadcasts ship from their dashboard.

Flag any open items from the spec's "Open questions" section that still aren't resolved:
- Mailing address for CAN-SPAM footer (needed before first Broadcast).
- Welcome drip (deferred; revisit when needed).

---

## Self-review notes (recorded after writing)

- **Spec coverage check:** all sections covered.
  - Architecture → Task 2, 3, 4.
  - API contract → Task 4.
  - Welcome email → Task 3 + Task 4.
  - Environment variables → Task 6 Step 1 (local) + Task 7 Step 3 (Vercel).
  - Deployment → Task 7, 8.
  - Testing plan → Task 6.
  - Failure modes → Task 4 (try/catch + 500) + Task 6 Step 7 (simulation).
  - Security → Task 4 (server-only env, honeypot) + Task 5 (honeypot input). No CORS config needed — same-origin.
  - Out of scope items deliberately NOT in the plan: no drip, no double-opt-in, no rate limiting, no custom unsubscribe page.
  - Open questions left unresolved in the plan: mailing address (Task 9 Step 3 flags it).
- **Placeholder scan:** no `TBD`, no `TODO`, no "implement later". Verification steps are concrete shell commands with expected output. Task 5's edit uses exact line-number references and a full replacement region so the engineer doesn't have to interpret.
- **Type consistency:**
  - `WELCOME_SUBJECT`, `WELCOME_BODY`, `WELCOME_FROM`, `WELCOME_REPLY_TO` are defined in Task 3 and imported by name in Task 4. Consistent.
  - `resend` singleton export in Task 2, imported as `{ resend }` in Task 4. Consistent.
  - `honeypotRef` typed `HTMLInputElement | null` in Task 5 matches the `ref={honeypotRef}` on the `<input>`.
  - Route handler returns `NextResponse.json({ ok, error? }, { status })` in all paths — consistent shape.
- **One known simplification:** `lib/resend.ts` doesn't throw on missing `RESEND_API_KEY` at module load — it logs a warning and lets the first API call fail with 500. Chosen because throwing at module load breaks dev hot-reload during initial setup. The route handler also guards `RESEND_AUDIENCE_ID` explicitly.
- **Ordering:** Tasks 1–5 produce a working local build that can be tested in isolation (Task 6) before any deploy. Tasks 7–8 are external setup that doesn't touch code. Task 9 is a final sanity pass. This means if the user wants to ship in chunks, they can stop after Task 6 (feature works locally), after Task 7 (feature works on Vercel preview URL), or after Task 8 (feature live on `lucidpeak.co`).
