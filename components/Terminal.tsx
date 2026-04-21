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
