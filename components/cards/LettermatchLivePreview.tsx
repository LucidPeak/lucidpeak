"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "setup" | "scan" | "collapse" | "resolve";

type Stamp = {
  id: string;
  label: string;
  shared: boolean;
};

const YOU_LIST: Stamp[] = [
  { id: "dune", label: "DUNE", shared: false },
  { id: "blade", label: "BLADE", shared: true },
  { id: "past", label: "PAST", shared: false },
  { id: "arrival", label: "ARRIVAL", shared: true },
  { id: "parasite", label: "PARASITE", shared: false },
  { id: "her", label: "HER", shared: true },
];

const FRIEND_LIST: Stamp[] = [
  { id: "tar", label: "TÁR", shared: false },
  { id: "blade", label: "BLADE", shared: true },
  { id: "oppn", label: "OPPN", shared: false },
  { id: "arrival", label: "ARRIVAL", shared: true },
  { id: "anora", label: "ANORA", shared: false },
  { id: "her", label: "HER", shared: true },
];

const SHARED = [
  { title: "Blade Runner 2049", year: "'17", poster: "/posters/blade-runner-2049.jpg" },
  { title: "Arrival", year: "'16", poster: "/posters/arrival.jpg" },
  { title: "Her", year: "'13", poster: "/posters/her.jpg" },
];

const CAPTIONS: Record<Phase, string> = {
  idle: "",
  setup: "you vs. @andrea",
  scan: "comparing 142 films",
  collapse: "finding overlap",
  resolve: "3 shared — go watch",
};

const FRIEND_HANDLE = "@andrea";

const PHASE_DURATIONS: Record<Phase, number> = {
  idle: 2400,
  setup: 1400,
  scan: 1400,
  collapse: 1000,
  resolve: 1800,
};

const SEQUENCE: Phase[] = ["idle", "setup", "scan", "collapse", "resolve"];

export function LettermatchLivePreview() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [cycle, setCycle] = useState(0);
  const [typed, setTyped] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(resolve, ms);
        timers.push(t);
      });

    async function loop() {
      while (!cancelled) {
        setCycle((c) => c + 1);
        for (const p of SEQUENCE) {
          setPhase(p);
          if (p === "idle") {
            setTyped(0);
            await wait(600);
            if (cancelled) return;
            for (let i = 1; i <= FRIEND_HANDLE.length; i++) {
              await wait(100);
              if (cancelled) return;
              setTyped(i);
            }
            await wait(
              PHASE_DURATIONS.idle - 600 - FRIEND_HANDLE.length * 100,
            );
            if (cancelled) return;
          } else {
            await wait(PHASE_DURATIONS[p]);
            if (cancelled) return;
          }
        }
      }
    }

    loop();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [visible]);

  return (
    <div
      ref={rootRef}
      className="card-visual lm-preview"
      aria-hidden
      data-phase={phase}
    >
      <div className="lm-top">
        <span className="lm-brand-mark">
          <svg viewBox="0 0 32 32" aria-hidden>
            <rect width="32" height="32" rx="7" fill="#14181c" />
            <g
              fill="none"
              stroke="#00e054"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(4 4)"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 3v18" />
              <path d="M3 7.5h4" />
              <path d="M3 12h18" />
              <path d="M3 16.5h4" />
              <path d="M17 3v18" />
              <path d="M17 7.5h4" />
              <path d="M17 16.5h4" />
            </g>
          </svg>
        </span>
        <span className="lm-brand-name">LetterMatch</span>
      </div>

      <div className="lm-story">
        <div className="lm-idle">
          <div className="lm-idle-hero">
            <h3 className="lm-idle-title">Find Your Next Watch</h3>
            <p className="lm-idle-sub">
              Compare <span className="lm-idle-sub-tag">Letterboxd</span> watchlists
            </p>
          </div>
          <div className="lm-idle-form">
            <span className="lm-idle-input">
              {typed === 0 ? (
                <span className="lm-idle-input-placeholder">username</span>
              ) : (
                <span className="lm-idle-input-text">
                  {FRIEND_HANDLE.slice(0, typed)}
                  <span className="lm-idle-input-caret" aria-hidden />
                </span>
              )}
            </span>
            <span className="lm-idle-btn">Load</span>
          </div>
        </div>

        <div className="lm-compare">
          <div className="lm-column lm-column-left">
            <span className="lm-column-label">you</span>
            <ul className="lm-stamps">
              {YOU_LIST.map((s, i) => (
                <li
                  key={s.id}
                  className="lm-stamp"
                  data-shared={s.shared}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  {s.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="lm-scan-lane">
            <span className="lm-scanline" aria-hidden />
          </div>
          <div className="lm-column lm-column-right">
            <span className="lm-column-label">@andrea</span>
            <ul className="lm-stamps">
              {FRIEND_LIST.map((s, i) => (
                <li
                  key={s.id}
                  className="lm-stamp"
                  data-shared={s.shared}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  {s.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lm-resolved">
          <div className="lm-resolved-header">
            <span className="lm-resolved-heart" aria-hidden>
              <svg viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 10.5 1.8 6.3a2.4 2.4 0 0 1 3.4-3.4L6 3.7l.8-.8a2.4 2.4 0 0 1 3.4 3.4L6 10.5z" />
              </svg>
            </span>
            <span className="lm-resolved-count">3 matches found</span>
          </div>
          <div className="lm-resolved-cards">
          {SHARED.map((m, i) => (
            <div
              key={m.title}
              className="lm-resolved-card"
              style={{ "--i": i } as React.CSSProperties}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="lm-resolved-poster"
                src={m.poster}
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
              />
              <span className="lm-resolved-caption">
                <span className="lm-resolved-title">{m.title}</span>
                <span className="lm-resolved-year">{m.year}</span>
              </span>
              <span className="lm-resolved-stamp" aria-hidden>
                <svg viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2.5 5.2 4.2 7l3.3-4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          ))}
          </div>
        </div>
      </div>

      <div className="lm-caption-row">
        <span key={`${cycle}-${phase}`} className="lm-caption">
          {CAPTIONS[phase]}
        </span>
      </div>
    </div>
  );
}
