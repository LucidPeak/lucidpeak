"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

export type TokenKind = "kw" | "str" | "com" | "fn" | "num" | "op" | "txt";
export type Token = { text: string; kind?: TokenKind };
export type Line = Token[];

type Props = {
  lines: Line[];
  speed?: number;
  animated?: boolean;
  /** How many lines to keep mounted before the oldest scrolls off */
  windowSize?: number;
};

export function CodeTyper({
  lines,
  speed = 45,
  animated = true,
  windowSize = 40,
}: Props) {
  const lineLens = useMemo(
    () => lines.map((ln) => ln.reduce((a, t) => a + t.text.length, 0)),
    [lines],
  );
  const cycleChars = useMemo(
    () => lineLens.reduce((a, n) => a + Math.max(1, n), 0),
    [lineLens],
  );

  // Monotonically increasing cursor — never resets.
  // SSR-safe init: deterministic value. On client mount we jump forward past
  // enough cycles to fill the window, then add a random offset so the card
  // lands mid-typing and is never empty.
  const [pos, setPos] = useState(() => (animated ? 0 : cycleChars));
  const posRef = useRef(pos);
  posRef.current = pos;

  // Client-only: seed the starting position so cards are never blank.
  useEffect(() => {
    if (!animated) return;
    if (cycleChars === 0 || lines.length === 0) return;
    const cyclesToFill = Math.max(2, Math.ceil(windowSize / lines.length) + 1);
    const base = cycleChars * cyclesToFill;
    const jitter = Math.floor(Math.random() * cycleChars);
    setPos(base + jitter);
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!animated) return;
    if (lines.length === 0) return;
    const id = setInterval(() => {
      setPos((p) => p + 1);
    }, speed);
    return () => clearInterval(id);
  }, [animated, lines.length, speed]);

  // Walk the cycled source to derive visible state at this pos.
  const rendered: ReactElement[] = [];
  let consumed = 0;
  let logicalLine = 0; // 1-based-ish; start count
  let i = 0;
  // Fast-forward logicalLine + consumed to where window begins.
  // We want the last `windowSize` fully-or-partially typed lines.
  // Easiest: replay from a position that keeps ~windowSize lines behind pos.
  const effectiveLines = lines.length;
  // Each source line contributes at least 1 "virtual char" (for blank lines) so
  // empty lines still consume the clock.
  // Estimate starting line index: how many source-lines were completed before pos
  let completedSourceLines = 0;
  let totalConsumed = 0;
  while (totalConsumed < pos) {
    const idx = completedSourceLines % effectiveLines;
    const len = Math.max(1, lineLens[idx]);
    if (totalConsumed + len > pos) break;
    totalConsumed += len;
    completedSourceLines += 1;
  }
  // Now completedSourceLines is how many full logical lines are done.
  // Render from (completedSourceLines - windowSize + 1) up to completedSourceLines (+ current partial).
  const firstRenderedLine = Math.max(0, completedSourceLines - windowSize + 1);
  // Re-walk from start of firstRenderedLine
  let walkConsumed = 0;
  for (let k = 0; k < firstRenderedLine; k++) {
    walkConsumed += Math.max(1, lineLens[k % effectiveLines]);
  }
  consumed = walkConsumed;
  i = firstRenderedLine;
  logicalLine = firstRenderedLine + 1;

  while (consumed <= pos && i <= completedSourceLines) {
    const idx = i % effectiveLines;
    const line = lines[idx];
    const lineLen = lineLens[idx];
    const virtualLen = Math.max(1, lineLen);
    const typedInLine = Math.max(0, Math.min(lineLen, pos - consumed));
    const isCurrentLine = i === completedSourceLines && pos >= consumed;

    const tokens: ReactElement[] = [];
    let used = 0;
    for (let j = 0; j < line.length; j++) {
      const tok = line[j];
      const visible = Math.max(0, Math.min(tok.text.length, typedInLine - used));
      if (visible > 0) {
        tokens.push(
          <span
            key={j}
            className={`code-tok code-tok-${tok.kind ?? "txt"}`}
          >
            {tok.text.slice(0, visible)}
          </span>,
        );
      }
      used += tok.text.length;
      if (used >= typedInLine) break;
    }

    rendered.push(
      <div key={logicalLine} className="code-line">
        <span className="code-num">{logicalLine}</span>
        <span className="code-line-body">
          {tokens}
          {isCurrentLine && <span className="code-cursor" aria-hidden />}
        </span>
      </div>,
    );

    consumed += virtualLen;
    i += 1;
    logicalLine += 1;
    if (isCurrentLine) break;
  }

  return (
    <div className="card-visual code-typer" aria-hidden>
      <pre className="code-pre">{rendered}</pre>
    </div>
  );
}
