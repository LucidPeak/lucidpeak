import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  // Module-load failure is surfaced at the first API call. Throwing here would
  // crash any dev hot-reload that happens before env vars are wired up.
  // Route handler checks this before calling Resend.
  console.warn("RESEND_API_KEY is not set — /api/subscribe will return 500.");
}

export const resend = new Resend(apiKey ?? "missing");
