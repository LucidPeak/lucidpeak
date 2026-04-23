# Newsletter Backend — Design Spec

**Date:** 2026-04-23
**Status:** Approved for planning
**Scope:** Wire the existing Terminal signup UI to Resend so that subscribers are captured on a real list and receive an immediate welcome email. Prepare the site for Vercel deployment. No drip sequences, no double-opt-in, no custom unsubscribe page in v1.

## Intent

The Terminal window on `lucidpeak.co` already looks and feels like a subscribe flow, but it currently POSTs to a missing endpoint. This spec finishes the circuit: a tiny server route on the lucidpeak.co origin receives the email, hands it to Resend, and confirms back to the Terminal. Resend becomes the single source of truth for the subscriber list, welcome email, deliverability, and future Broadcasts. The site itself stores nothing.

## Architecture

**Separation of concerns:**

- **Terminal (client)** — collects email + honeypot, submits to same-origin `/api/subscribe`, renders history based on response.
- **`/api/subscribe` route (server)** — validates input, rejects honeypot hits silently, calls Resend twice (contact create + email send), returns JSON status.
- **Resend** — owns list storage (segment `General`), welcome email delivery, future newsletter Broadcasts, deliverability infra, unsubscribe handling, CAN-SPAM footer injection.

```
Terminal ──POST /api/subscribe──▶ Next.js route handler
                                        │
                                        ├── resend.contacts.create({ email, audienceId })
                                        └── resend.emails.send({ from, to, replyTo, subject, text })
                                        │
                                        ◀── 200 / 400 / 500
```

**Why this split:**

- API key stays server-side. A browser-side call to Resend would leak `RESEND_API_KEY`.
- The site owns nothing persistent. No DB, no migrations, no backups. If we ever want to leave Resend, we export the contact list.

## Owned code

Minimal surface, isolated files:

| File | Purpose | Size estimate |
|---|---|---|
| `lib/resend.ts` | Single `Resend` SDK instance. Reads `RESEND_API_KEY` from env at module load. | ~5 lines |
| `lib/welcome-email.ts` | Plain-text welcome email body + subject as exported constants. | ~25 lines |
| `app/api/subscribe/route.ts` | POST handler. Validates, calls Resend, returns JSON. | ~55 lines |
| `components/Terminal.tsx` | Edit: add hidden `website` honeypot input; change POST target from `process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT` to literal `/api/subscribe`; drop the unused env var reference. | ~5 lines changed |

No other components touched. No new dependencies beyond `resend` (installed via `npm install resend`).

## API contract

### Endpoint

`POST /api/subscribe`
Same-origin only. Runs on Vercel's Node runtime (not Edge — the Resend SDK imports Node-only APIs). `export const runtime = "nodejs"` is explicit in the route.

### Request body

```json
{
  "email": "luna@hello.com",
  "website": ""
}
```

- **`email`** — string, user-typed. Trimmed server-side. Required.
- **`website`** — honeypot. Real form renders this input hidden with `position: absolute; left: -9999px; tabindex=-1; aria-hidden=true; autocomplete="off"`. Humans won't touch it. Bots tend to fill every input.

### Response codes

| Status | Meaning | Terminal renders |
|---|---|---|
| `200 { ok: true }` | Contact added (or re-added — Resend dedups silently). Welcome email dispatched. | `✓ subscribed. see you soon.` |
| `200 { ok: true, bot: true }` | Honeypot tripped. Silently swallowed. | Same success visual — do not confirm the detection. |
| `400 { ok: false, error: "invalid_email" }` | Shape check failed (empty, missing `@`, >254 chars). | `err: not a valid email` |
| `500 { ok: false, error: "server" }` | Resend API threw, timed out, or returned non-2xx. Logged server-side. | `err: couldn't reach the server — try again?` |

### Server-side logic (in order)

1. Parse JSON body. On `SyntaxError` → 400.
2. If `typeof body.website === "string" && body.website.length > 0` → return `200 { ok: true, bot: true }`. Do not proceed.
3. Validate email: `trimmed.length > 0 && trimmed.length <= 254 && trimmed.includes("@")`. On fail → 400 `invalid_email`.
4. `resend.contacts.create({ email: trimmed, audienceId: process.env.RESEND_AUDIENCE_ID, unsubscribed: false })`. Resend is idempotent on email; resubmitting an existing email returns success, not error.
5. `resend.emails.send({ from: "Lucidpeak <hello@mail.lucidpeak.co>", to: trimmed, replyTo: "lucidpeak@proton.me", subject: WELCOME_SUBJECT, text: WELCOME_BODY })`.
6. On any thrown error in 4 or 5 → `console.error` + return 500. The contact may have been created but the email failed; that's acceptable in v1 (they're on the list, we just owe them a first email — Resend retries for deliverability, so this is rare).

### What we deliberately don't send to Resend

- IP address
- User agent
- Referrer
- Timestamp (Resend records its own)

Less data = less GDPR surface + less tempting to build features on.

## Welcome email

Stored as a constant in `lib/welcome-email.ts`. Plain text (not HTML) — matches the studio-terminal brand, lower spam risk, zero design effort.

**Subject:** `welcome to lucidpeak`

**Body:**

```
hey —

thanks for subscribing.

lucidpeak is a studio that ships small, considered apps.
when there's something new (a launch, a build log, a tool
that might be useful), i'll send a short note here.

no hype, no pestering. reply if you want to chat.

— nikita
lucidpeak.co
```

**Headers:**

- `From: Lucidpeak <hello@mail.lucidpeak.co>` — sender domain verified in Resend.
- `Reply-To: lucidpeak@proton.me` — replies land in the real Proton inbox.

**Footer:** Resend auto-injects unsubscribe link + physical address (CAN-SPAM / GDPR compliant). The physical address is configured once in Resend Settings. **Open question:** mailing address to use — to be confirmed before first Broadcast. Welcome email can ship with Resend's default until resolved.

## Environment variables

| Key | Where | Value | Scope |
|---|---|---|---|
| `RESEND_API_KEY` | Vercel dashboard + `.env.local` | `re_...` from Resend → API Keys → `lucidpeak-prod` | Server-only (never prefixed `NEXT_PUBLIC_`) |
| `RESEND_AUDIENCE_ID` | Vercel dashboard + `.env.local` | UUID of the `General` segment | Server-only |

`.env.local` is already in `.gitignore` (Next.js default). Do not commit.

**Removed:** `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` — no longer used. The Terminal now hardcodes `/api/subscribe` (same-origin, no env needed). Delete the reference in `Terminal.tsx`.

## Deployment (Vercel)

### First-time setup

1. Push working code to GitHub (repo already exists).
2. Vercel dashboard → **Add New Project** → import the lucidpeak.co repo.
3. Framework preset: auto-detected as Next.js. Leave defaults.
4. Environment Variables → add `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` (Production + Preview + Development).
5. Click **Deploy**. First build takes ~1–2 min.
6. Visit the assigned `*.vercel.app` URL. Run through the manual test plan below.

### Custom domain

1. Vercel project → **Domains** → add `lucidpeak.co` and `www.lucidpeak.co`.
2. Vercel shows a DNS instruction: one CNAME (for `www`) and either an A record or a CNAME flattened on the apex.
3. Cloudflare → `lucidpeak.co` zone → DNS → Records → add per Vercel's instruction. Grey cloud ("DNS only") — do not proxy through Cloudflare, it conflicts with Vercel's edge.
4. Wait for green check in Vercel → domain is live.

### Ongoing

- `git push` to `main` → Vercel auto-builds + deploys.
- PR pushes → Vercel builds a preview URL, commented on the PR.
- Env vars persist; no need to reconfigure per deploy.

## Testing plan

Local first (catch 90% of issues before burning a deploy):

1. `echo 'RESEND_API_KEY=re_...\nRESEND_AUDIENCE_ID=<uuid>' >> .env.local`
2. `npm run dev` → open `http://localhost:3001`.
3. **Happy path:** type your own email in the Terminal, press Return. Expect:
   - Terminal shows `✓ subscribed. see you soon.`
   - Welcome email arrives in inbox within ~10 seconds.
   - Resend dashboard → Audience → `General` shows the new contact.
4. **Invalid email:** type `foo`, Return. Expect `err: not a valid email`. No contact created.
5. **Idempotency:** submit your email a second time. Expect same visual success, no error. Resend dedups.
6. **Honeypot:** open devtools, set `document.querySelector('input[name="website"]').value = 'x'`, submit. Expect visual success, no contact created.
7. **Network error simulation:** temporarily break the `RESEND_API_KEY` (e.g. replace with `re_broken`), restart dev server, submit. Expect `err: couldn't reach the server — try again?`. Restore key after.

Deploy only after local tests pass. Repeat tests 3 and 4 against the Vercel preview URL.

## Failure modes & edge cases

- **Resend unreachable / 5xx** → 500 back to Terminal. User sees server error, can retry. No state corruption.
- **Contact created but email send fails** → 500 back to Terminal, contact stays on list. User might retry and succeed next time; Resend's dedup means no duplicate contact. Log the condition for manual follow-up.
- **Malformed JSON body** → 400. Caught by `try/catch` around `req.json()`.
- **Missing env vars at runtime** → module import fails fast; Vercel build surfaces it. A deployed misconfiguration surfaces on the first API call as 500.
- **Same-email rapid-fire submits** → each call pays the Resend round-trip but state converges (one contact, one welcome email per submission — dedup on contact, not on email send). Acceptable for v1.
- **Vercel function timeout** (10s default on Hobby) → 500. Resend calls typically return in <1s; only a network partition would hit this.
- **Empty `RESEND_AUDIENCE_ID`** → Resend's `contacts.create` throws. Caught as 500.

## Security

- API key never leaves the server. No `NEXT_PUBLIC_*` envs involved.
- No CORS concerns — route is same-origin, and cross-origin POST attempts get the default Next.js same-origin behavior (no `Access-Control-Allow-Origin` header set, so browsers block).
- No auth. The endpoint is intentionally public — it's a signup form.
- Honeypot is the only anti-abuse measure in v1. Rate limiting and Turnstile explicitly deferred; revisit if logs show real abuse.
- No logging of email addresses in plaintext application logs. Resend handles PII on its side; our server logs capture only error conditions.

## Out of scope (explicit)

- Double-opt-in confirmation flow.
- Resubscribe / unsubscribe UX on lucidpeak.co (handled entirely by Resend's hosted links).
- Welcome drip (multi-step onboarding). Deferred. When added, implementation = dashboard Automation + one `resend.events.emit` call appended to the API route. Zero Terminal changes.
- Scheduled newsletter automation. Broadcasts run manually from the Resend dashboard in v1.
- Hosted archive page on lucidpeak.co.
- Rate limiting, CAPTCHA, Turnstile.
- Analytics events on submit (GA4, PostHog, etc.).
- Admin UI for managing subscribers — use Resend's dashboard.

## Open questions (non-blocking)

- **Mailing address for CAN-SPAM footer.** Resend ships a default for welcome email; must be resolved before the first Broadcast. Owner: Nikita.
- **`from` alias.** `hello@mail.lucidpeak.co` is the agreed sending address. If a future transactional flow wants a different alias (e.g. `no-reply@`, `broadcasts@`), they're all free subdomain aliases — no DNS changes needed. Out of scope now.
- **Node runtime vs Edge.** Forced to Node because the Resend SDK uses Node-only APIs. If Resend publishes an Edge-compatible SDK, moving to Edge cuts cold-start latency. Revisit in 6 months.
