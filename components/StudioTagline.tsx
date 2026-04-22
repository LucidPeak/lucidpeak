"use client";

import { useEffect, useState } from "react";

const PREFIX = "we ship for ";
const WORDS = ["designers", "devs", "creatives", "founders", "tinkerers"];

const TYPE_MS = 80;
const ERASE_MS = 45;
const HOLD_FULL_MS = 1600;
const HOLD_EMPTY_MS = 220;

type Phase = "typing-prefix" | "typing-word" | "holding" | "erasing-word";

export function StudioTagline() {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("typing-prefix");
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    let timer: number | undefined;
    const target = PREFIX + WORDS[wordIdx];

    if (phase === "typing-prefix") {
      if (text.length < PREFIX.length) {
        timer = window.setTimeout(
          () => setText(PREFIX.slice(0, text.length + 1)),
          TYPE_MS,
        );
      } else {
        setPhase("typing-word");
      }
    } else if (phase === "typing-word") {
      if (text.length < target.length) {
        timer = window.setTimeout(
          () => setText(target.slice(0, text.length + 1)),
          TYPE_MS,
        );
      } else {
        timer = window.setTimeout(() => setPhase("holding"), HOLD_FULL_MS);
      }
    } else if (phase === "holding") {
      setPhase("erasing-word");
    } else if (phase === "erasing-word") {
      if (text.length > PREFIX.length) {
        timer = window.setTimeout(
          () => setText(text.slice(0, -1)),
          ERASE_MS,
        );
      } else {
        timer = window.setTimeout(() => {
          setWordIdx((i) => (i + 1) % WORDS.length);
          setPhase("typing-word");
        }, HOLD_EMPTY_MS);
      }
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [text, phase, wordIdx]);

  return (
    <div className="studio-tagline" aria-live="off">
      <span className="studio-tagline-text">{text}</span>
      <span className="studio-tagline-caret" aria-hidden />
      <span className="sr-only">we ship for designers, devs, creatives, founders, tinkerers</span>
    </div>
  );
}
