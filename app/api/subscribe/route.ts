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
