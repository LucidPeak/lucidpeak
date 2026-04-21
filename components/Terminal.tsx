"use client";

import { useEffect, useRef, useState } from "react";

type HistoryEntry =
  | { kind: "submission"; email: string }
  | { kind: "success" }
  | { kind: "error"; message: string };

type Status = "idle" | "typing" | "submitting" | "success" | "error";

const ERR_INVALID_VISUAL = "err: not a valid email";
const ERR_NETWORK_VISUAL = "err: couldn't reach the server — try again?";
const ERR_INVALID_SR = "Not a valid email address.";
const ERR_NETWORK_SR = "Couldn't reach the server. Try again.";
const SUCCESS_SR = "Subscribed. See you soon.";

const STORAGE_KEY_HISTORY = "lp:terminal:history";

function isValidEmail(value: string) {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  if (!trimmed.includes("@")) return false;
  return true;
}

export function Terminal() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY_HISTORY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as HistoryEntry[];
      return [];
    } catch {
      return [];
    }
  });
  const [focused, setFocused] = useState(false);
  const [lastAnnouncement, setLastAnnouncement] = useState("");
  const [announceTick, setAnnounceTick] = useState(0);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {
      // storage might be unavailable (Safari private, quota, etc.) — fail silent
    }
  }, [history]);

  const focusInput = (e?: React.MouseEvent) => {
    if (e && (e.target as HTMLElement).closest("input, button, a")) return;
    inputRef.current?.focus();
  };

  const appendErrorHistory = (visual: string, sr: string, submitted: string) => {
    setHistory((prev) => [
      ...prev,
      { kind: "submission", email: submitted },
      { kind: "error", message: visual },
    ]);
    setLastAnnouncement(sr);
    setAnnounceTick((n) => n + 1);
    setStatus("error");
    setShaking(true);
    setTimeout(() => setShaking(false), 220);
    // Pre-select the invalid value so the user can retype immediately.
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = email.trim();
    if (!isValidEmail(value)) {
      appendErrorHistory(ERR_INVALID_VISUAL, ERR_INVALID_SR, value);
      return;
    }
    setStatus("submitting");
    try {
      const endpoint = process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT;
      if (endpoint) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: value }),
            signal: controller.signal,
          });
          if (!res.ok) throw new Error("request failed");
        } finally {
          clearTimeout(timeoutId);
        }
      }
      setHistory((prev) => [
        ...prev,
        { kind: "submission", email: value },
        { kind: "success" },
      ]);
      setLastAnnouncement(SUCCESS_SR);
      setAnnounceTick((n) => n + 1);
      setEmail("");
      setStatus("idle");
      window.dispatchEvent(new CustomEvent("lp:terminal-success"));
    } catch {
      appendErrorHistory(ERR_NETWORK_VISUAL, ERR_NETWORK_SR, value);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (status === "error" || status === "success") setStatus("typing");
    else if (status === "idle") setStatus("typing");
  };

  return (
    <div
      ref={surfaceRef}
      className={`term-surface ${shaking ? "term-shake" : ""}`}
      onClick={focusInput}
      role="region"
      aria-label="Subscribe to updates"
    >
      <div className="term-stage">
        <div className="term-line term-dim">lucidpeak — studio terminal</div>
        <div className="term-line term-dim">type and press return</div>
        <div className="term-line">&nbsp;</div>

        <div className="term-line" aria-hidden="true">
          <span className="term-prompt">$ </span>
          subscribe <span className="term-flag">--email</span> luna@hello.com
        </div>
        <div className="term-line term-success" aria-hidden="true">
          ✓ subscribed. see you soon.
        </div>

        <div className="term-line">&nbsp;</div>

        {history.map((entry, i) => {
          if (entry.kind === "submission") {
            return (
              <div className="term-line term-history-enter" key={`h-${i}`}>
                <span className="term-prompt">$ </span>
                subscribe <span className="term-flag">--email</span> {entry.email}
              </div>
            );
          }
          if (entry.kind === "success") {
            return (
              <div className="term-line term-success term-history-enter" key={`h-${i}`}>
                ✓ subscribed. see you soon.
              </div>
            );
          }
          return (
            <div className="term-line term-err term-history-enter" key={`h-${i}`}>
              {entry.message}
            </div>
          );
        })}

        {status === "submitting" && (
          <div className="term-line term-dim term-submitting-dots">…</div>
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
              onChange={onChange}
              onKeyDown={(e) => {
                if (e.key === "Escape") inputRef.current?.blur();
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
          {lastAnnouncement
            ? lastAnnouncement + (announceTick % 2 === 1 ? "​" : "")
            : ""}
        </div>
      </div>
    </div>
  );
}
