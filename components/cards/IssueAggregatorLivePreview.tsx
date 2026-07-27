"use client";

import { useEffect, useRef, useState } from "react";
import { useInViewport } from "@/hooks/useInViewport";

type Phase = "idle" | "feeding" | "settled";

type Bounty = {
  id: string;
  repo: string;
  amount: string;
  lang: string;
  langColor: string;
  time: string;
};

const FEED: Bounty[] = [
  {
    id: "brackish",
    repo: "brackish/runtime",
    amount: "$750",
    lang: "rust",
    langColor: "#dea584",
    time: "8m",
  },
  {
    id: "winterfork",
    repo: "winterfork/api",
    amount: "$300",
    lang: "ts",
    langColor: "#3178c6",
    time: "1h",
  },
  {
    id: "voltbridge",
    repo: "voltbridge/core",
    amount: "$1,500",
    lang: "c++",
    langColor: "#f34b7d",
    time: "3h",
  },
  {
    id: "ironwood",
    repo: "ironwood-labs/sdk",
    amount: "$80",
    lang: "python",
    langColor: "#3572a5",
    time: "5h",
  },
];

const IDLE_MS = 1000;
const FEED_STEP_MS = 700;
const SETTLED_MS = 2000;

const CAPTIONS: Record<Phase, string> = {
  idle: "watching github",
  feeding: "live bounties",
  settled: "ready to claim",
};

export function IssueAggregatorLivePreview() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [fedCount, setFedCount] = useState(0);
  const [cycle, setCycle] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const visible = useInViewport(rootRef);

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

        setPhase("idle");
        setFedCount(0);
        await wait(IDLE_MS);
        if (cancelled) return;

        setPhase("feeding");
        for (let i = 1; i <= FEED.length; i++) {
          setFedCount(i);
          await wait(FEED_STEP_MS);
          if (cancelled) return;
        }

        setPhase("settled");
        await wait(SETTLED_MS);
        if (cancelled) return;
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
      className="card-visual ia-preview"
      aria-hidden
      data-phase={phase}
      data-fed={fedCount}
    >
      <div className="ia-top">
        <span className="ia-brand-mark">
          <svg viewBox="0 0 32 32" aria-hidden>
            <rect width="32" height="32" rx="7" fill="#080808" />
            <text
              y="22"
              textAnchor="middle"
              fontFamily="ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
              fontSize="18"
              fontWeight={800}
            >
              <tspan x="6" fill="#146ef5">{"{"}</tspan>
              <tspan x="16" fill="#ffffff">$</tspan>
              <tspan x="26" fill="#146ef5">{"}"}</tspan>
            </text>
          </svg>
        </span>
        <span className="ia-brand-name">IssueAggregator</span>
        <span className="ia-live-pill" aria-hidden>
          <span className="ia-live-dot" />
          live
        </span>
      </div>

      <div className="ia-feed">
        <ul className="ia-rows">
          {FEED.map((b, i) => {
            const idx = i + 1;
            const revealed = phase !== "idle" && idx <= fedCount;
            const justFed =
              phase === "feeding" && idx === fedCount && fedCount > 0;
            return (
              <li
                key={b.id}
                className="ia-row"
                data-i={idx}
                data-revealed={revealed ? "true" : "false"}
                data-just-fed={justFed ? "true" : "false"}
              >
                <div className="ia-row-head">
                  <span className="ia-row-repo">{b.repo}</span>
                  <span className="ia-row-amount">{b.amount}</span>
                </div>
                <div className="ia-row-meta">
                  <span
                    className="ia-lang-chip"
                    style={{ "--lang": b.langColor } as React.CSSProperties}
                  >
                    <span className="ia-lang-dot" aria-hidden />
                    {b.lang}
                  </span>
                  <span className="ia-row-time">{b.time}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="ia-caption-row">
        <span key={`${cycle}-${phase}`} className="ia-caption">
          {CAPTIONS[phase]}
        </span>
      </div>
    </div>
  );
}
