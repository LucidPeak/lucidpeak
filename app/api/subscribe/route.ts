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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string) {
  return value.length <= 254 && EMAIL_RE.test(value);
}

// ponytail: in-memory per-instance rate limit. Good enough while traffic is
// tiny; swap for a durable store (Upstash/edge config) if abuse shows up.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(key: string, limit: number): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now > h.reset) {
    if (hits.size > 5000) hits.clear();
    hits.set(key, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  h.count += 1;
  return h.count > limit;
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

  const ip = (req.headers.get("x-forwarded-for") ?? "unknown")
    .split(",")[0]
    .trim();
  if (
    rateLimited(`ip:${ip}`, 5) ||
    rateLimited(`email:${email.toLowerCase()}`, 2)
  ) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429 },
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
      segments: [{ id: audienceId }],
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
