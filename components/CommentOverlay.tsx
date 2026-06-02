"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Rect = { x: number; y: number; w: number; h: number };
type Point = { x: number; y: number };
type Tool = "box" | "pen";
type Status = "idle" | "saving" | "saved" | "error";

type PendingSelection = {
  tool: Tool;
  rect: Rect;
  strokes: Point[][] | null;
  selector: string | null;
  elementText: string | null;
};

type StashEntry = {
  file: string;
  timestamp: string;
  note: string;
  url: string;
  tool?: Tool;
  rect: Rect;
  selector: string | null;
};

function buildSelector(el: Element | null): string | null {
  if (!el || !(el instanceof HTMLElement)) return null;
  const parts: string[] = [];
  let node: Element | null = el;
  let depth = 0;
  while (node && node.nodeType === 1 && depth < 4) {
    let part = node.tagName.toLowerCase();
    if (node.id) {
      part += `#${node.id}`;
      parts.unshift(part);
      break;
    }
    const cls = (node.getAttribute("class") || "")
      .split(/\s+/)
      .filter((c: string) => c && !c.startsWith("__"))
      .slice(0, 2)
      .join(".");
    if (cls) part += `.${cls}`;
    const parent: Element | null = node.parentElement;
    const current: Element = node;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === current.tagName,
      );
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current) + 1;
        part += `:nth-of-type(${idx})`;
      }
    }
    parts.unshift(part);
    node = parent;
    depth++;
  }
  return parts.join(" > ");
}

function hitTest(clientX: number, clientY: number): {
  selector: string | null;
  elementText: string | null;
} {
  const root = document.getElementById("__comment_overlay_root");
  const prev = root?.style.visibility ?? "";
  if (root) root.style.visibility = "hidden";
  const el = document.elementFromPoint(clientX, clientY);
  if (root) root.style.visibility = prev;
  return {
    selector: buildSelector(el),
    elementText:
      el instanceof HTMLElement
        ? (el.innerText || "").trim().slice(0, 140) || null
        : null,
  };
}

function bboxOfStrokes(strokes: Point[][]): Rect {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const s of strokes) {
    for (const p of s) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function CommentOverlay() {
  const [active, setActive] = useState(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [drawingRect, setDrawingRect] = useState<Rect | null>(null);
  const [currentStroke, setCurrentStroke] = useState<Point[] | null>(null);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [stashOpen, setStashOpen] = useState(false);
  const [stash, setStash] = useState<StashEntry[]>([]);
  const [scrollTick, setScrollTick] = useState(0);
  const startRef = useRef<Point | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const reset = useCallback(() => {
    setDrawingRect(null);
    setCurrentStroke(null);
    setStrokes([]);
    setPending(null);
    setNote("");
    startRef.current = null;
  }, []);

  useEffect(() => {
    if (pending && textareaRef.current) textareaRef.current.focus();
  }, [pending]);

  useEffect(() => {
    let raf = 0;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setScrollTick((t) => t + 1);
        raf = 0;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const loadStash = useCallback(async () => {
    try {
      const res = await fetch("/api/comments", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { entries?: StashEntry[] };
      setStash(data.entries ?? []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadStash();
  }, [loadStash, savedPath]);

  useEffect(() => {
    if (stashOpen) loadStash();
  }, [stashOpen, loadStash]);

  async function deleteStashItem(file: string) {
    try {
      await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file }),
      });
      setStash((prev) => prev.filter((e) => e.file !== file));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (pending) reset();
        else if (strokes.length > 0 || currentStroke) {
          setStrokes([]);
          setCurrentStroke(null);
        } else if (active) {
          setActive(false);
          reset();
        }
      }
      if (!active || pending) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT")) return;
      if (e.key === "Enter" && tool === "pen" && strokes.length > 0) {
        e.preventDefault();
        commitPen();
        return;
      }
      if (e.key === "b" || e.key === "B") setTool("box");
      if (e.key === "p" || e.key === "P") setTool("pen");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);

  }, [active, pending, reset, strokes, currentStroke, tool]);

  function commitPen() {
    if (strokes.length === 0) return;
    const rect = bboxOfStrokes(strokes);
    if (rect.w < 4 && rect.h < 4) return;
    const first = strokes[0][0];
    const hit = hitTest(first.x - window.scrollX, first.y - window.scrollY);
    setPending({ tool: "pen", rect, strokes, ...hit });
  }

  function onMouseDown(e: React.MouseEvent) {
    if (!active || pending) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    if (tool === "box") {
      setDrawingRect({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
    } else {
      setCurrentStroke([
        { x: e.clientX + window.scrollX, y: e.clientY + window.scrollY },
      ]);
    }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!active || !startRef.current || pending) return;
    if (tool === "box") {
      const s = startRef.current;
      setDrawingRect({
        x: Math.min(s.x, e.clientX),
        y: Math.min(s.y, e.clientY),
        w: Math.abs(e.clientX - s.x),
        h: Math.abs(e.clientY - s.y),
      });
    } else {
      setCurrentStroke((prev) =>
        prev
          ? [
              ...prev,
              {
                x: e.clientX + window.scrollX,
                y: e.clientY + window.scrollY,
              },
            ]
          : prev,
      );
    }
  }

  function onMouseUp(e: React.MouseEvent) {
    if (!active || !startRef.current || pending) return;
    const s = startRef.current;

    if (tool === "box") {
      const w = Math.abs(e.clientX - s.x);
      const h = Math.abs(e.clientY - s.y);
      if (w < 6 && h < 6) {
        setDrawingRect(null);
        startRef.current = null;
        return;
      }
      const rect: Rect = {
        x: Math.min(s.x, e.clientX) + window.scrollX,
        y: Math.min(s.y, e.clientY) + window.scrollY,
        w,
        h,
      };
      const cx = rect.x - window.scrollX + rect.w / 2;
      const cy = rect.y - window.scrollY + rect.h / 2;
      const hit = hitTest(cx, cy);
      setPending({ tool: "box", rect, strokes: null, ...hit });
      setDrawingRect(null);
    } else {
      const pts = currentStroke ?? [];
      setCurrentStroke(null);
      if (pts.length >= 2) {
        setStrokes((prev) => [...prev, pts]);
      }
    }
    startRef.current = null;
  }

  async function submit() {
    if (!pending || !note.trim()) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: note.trim(),
          url: window.location.href,
          viewport: { w: window.innerWidth, h: window.innerHeight },
          tool: pending.tool,
          rect: pending.rect,
          strokes: pending.strokes,
          selector: pending.selector,
          elementText: pending.elementText,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { file?: string };
      setStatus("saved");
      setSavedPath(data.file ?? null);
      reset();
      setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2200);
    }
  }

  const popupStyle: React.CSSProperties | null = pending
    ? (() => {
        const rx = pending.rect.x - window.scrollX;
        const ry = pending.rect.y - window.scrollY;
        const placeBelow = ry + pending.rect.h + 220 < window.innerHeight;
        return {
          position: "fixed",
          left: Math.max(12, Math.min(rx, window.innerWidth - 320)),
          top: placeBelow
            ? ry + pending.rect.h + 8
            : Math.max(12, ry - 210),
          width: 304,
        };
      })()
    : null;

  const strokeToPolyline = (pts: Point[]) =>
    pts
      .map((p) => `${p.x - window.scrollX},${p.y - window.scrollY}`)
      .join(" ");

  return (
    <div
      id="__comment_overlay_root"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483000,
        pointerEvents: active ? "auto" : "none",
      }}
    >
      <div
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        style={{
          position: "absolute",
          inset: 0,
          cursor:
            active && !pending
              ? tool === "pen"
                ? "crosshair"
                : "crosshair"
              : "default",
          background:
            active && !pending ? "rgba(16,16,18,0.06)" : "transparent",
          pointerEvents: active && !pending ? "auto" : "none",
        }}
      />

      {(drawingRect ||
        currentStroke ||
        strokes.length > 0 ||
        pending) && (
        <svg
          data-tick={scrollTick}
          style={{
            position: "fixed",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          {drawingRect && !pending && (
            <rect
              x={drawingRect.x}
              y={drawingRect.y}
              width={drawingRect.w}
              height={drawingRect.h}
              fill="rgba(249,115,22,0.12)"
              stroke="#f97316"
              strokeWidth={2}
            />
          )}
          {!pending &&
            strokes.map((s, i) => (
              <polyline
                key={i}
                points={strokeToPolyline(s)}
                fill="none"
                stroke="#f97316"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          {currentStroke && !pending && (
            <polyline
              points={strokeToPolyline(currentStroke)}
              fill="none"
              stroke="#f97316"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {pending && pending.tool === "box" && (
            <rect
              x={pending.rect.x - window.scrollX}
              y={pending.rect.y - window.scrollY}
              width={pending.rect.w}
              height={pending.rect.h}
              fill="rgba(249,115,22,0.12)"
              stroke="#f97316"
              strokeWidth={2}
            />
          )}
          {pending &&
            pending.tool === "pen" &&
            pending.strokes &&
            pending.strokes.map((s, i) => (
              <polyline
                key={i}
                points={strokeToPolyline(s)}
                fill="none"
                stroke="#f97316"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
        </svg>
      )}

      {pending && popupStyle && (
        <div
          style={{
            ...popupStyle,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 10,
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
            padding: 12,
            pointerEvents: "auto",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          }}
        >
          <textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder="What should I change here?"
            rows={4}
            style={{
              width: "100%",
              resize: "vertical",
              border: "1px solid rgba(0,0,0,0.15)",
              borderRadius: 6,
              padding: 8,
              fontSize: 13,
              color: "#101012",
              background: "#fff",
              outline: "none",
            }}
          />
          {pending.selector && (
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color: "#666",
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                wordBreak: "break-all",
              }}
            >
              {pending.selector}
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: 6,
              justifyContent: "flex-end",
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid rgba(0,0,0,0.15)",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!note.trim() || status === "saving"}
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #101012",
                background: "#101012",
                color: "#fff",
                cursor: note.trim() ? "pointer" : "not-allowed",
                opacity: note.trim() ? 1 : 0.5,
              }}
            >
              {status === "saving" ? "Saving…" : "Save (⌘↵)"}
            </button>
          </div>
        </div>
      )}

      {active && !pending && (
        <div
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 4,
            padding: 4,
            borderRadius: 999,
            background: "#101012",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            pointerEvents: "auto",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          }}
        >
          <button
            type="button"
            onClick={() => setTool("pen")}
            title="Pen (P) - freehand draw"
            style={{
              fontSize: 12,
              padding: "6px 12px",
              borderRadius: 999,
              border: "none",
              background: tool === "pen" ? "#f97316" : "transparent",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            ✎ pen
          </button>
          <button
            type="button"
            onClick={() => setTool("box")}
            title="Box (B) - drag rectangle"
            style={{
              fontSize: 12,
              padding: "6px 12px",
              borderRadius: 999,
              border: "none",
              background: tool === "box" ? "#f97316" : "transparent",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            ▢ box
          </button>
          {tool === "pen" && strokes.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => {
                  setStrokes((prev) => prev.slice(0, -1));
                }}
                title="Undo last stroke"
                style={{
                  fontSize: 12,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "none",
                  background: "transparent",
                  color: "#fff",
                  cursor: "pointer",
                  opacity: 0.85,
                }}
              >
                ↶ undo
              </button>
              <button
                type="button"
                onClick={commitPen}
                title="Done drawing (Enter) - add note"
                style={{
                  fontSize: 12,
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "none",
                  background: "#fff",
                  color: "#101012",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                done (↵)
              </button>
            </>
          )}
        </div>
      )}

      <div
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
          pointerEvents: "auto",
        }}
      >
        {status === "saved" && savedPath && (
          <span
            style={{
              fontSize: 11,
              color: "#101012",
              background: "#f6f4ee",
              border: "1px solid rgba(0,0,0,0.1)",
              padding: "4px 8px",
              borderRadius: 999,
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
            }}
          >
            saved → {savedPath}
          </span>
        )}
        {status === "error" && (
          <span
            style={{
              fontSize: 11,
              color: "#b91c1c",
              background: "#fff",
              border: "1px solid #b91c1c",
              padding: "4px 8px",
              borderRadius: 999,
            }}
          >
            save failed
          </span>
        )}
        <button
          type="button"
          onClick={() => setStashOpen((v) => !v)}
          aria-pressed={stashOpen}
          title="View saved comments"
          style={{
            fontSize: 12,
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,0.15)",
            background: stashOpen ? "#f97316" : "#fff",
            color: stashOpen ? "#fff" : "#101012",
            cursor: "pointer",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          }}
        >
          📋 {stash.length}
        </button>
        <button
          type="button"
          onClick={() => {
            if (pending) return;
            setActive((v) => !v);
          }}
          aria-pressed={active}
          title={active ? "Exit comment mode (Esc)" : "Enter comment mode"}
          style={{
            fontSize: 12,
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,0.15)",
            background: active ? "#f97316" : "#101012",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          }}
        >
          {active ? "● commenting" : "✎ comment"}
        </button>
      </div>

      {stashOpen && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            bottom: 72,
            width: 340,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 12,
            boxShadow: "0 20px 50px rgba(0,0,0,0.22)",
            padding: 12,
            pointerEvents: "auto",
            overflowY: "auto",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <strong style={{ fontSize: 13, color: "#101012" }}>
              Comments ({stash.length})
            </strong>
            <button
              type="button"
              onClick={() => setStashOpen(false)}
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 6,
                border: "1px solid rgba(0,0,0,0.15)",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
          {stash.length === 0 && (
            <div style={{ fontSize: 12, color: "#888" }}>
              No comments yet. Draw something and save.
            </div>
          )}
          {stash.map((e) => {
            const isThisUrl =
              typeof window !== "undefined" &&
              e.url === window.location.href;
            return (
              <div
                key={e.file}
                style={{
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 8,
                  padding: 8,
                  marginBottom: 8,
                  background: "#f9f8f4",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "#101012",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {e.note}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 10,
                    color: "#777",
                    fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  }}
                >
                  {e.timestamp?.replace("T", " ").slice(0, 19)} · {e.tool ?? "?"}
                </div>
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 10,
                    color: "#999",
                    wordBreak: "break-all",
                  }}
                >
                  {e.url}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    gap: 6,
                    justifyContent: "flex-end",
                  }}
                >
                  {isThisUrl && e.rect && (
                    <button
                      type="button"
                      onClick={() => {
                        window.scrollTo({
                          top: Math.max(0, e.rect.y - 120),
                          behavior: "smooth",
                        });
                      }}
                      style={{
                        fontSize: 11,
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid rgba(0,0,0,0.15)",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      scroll to
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteStashItem(e.file)}
                    style={{
                      fontSize: 11,
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: "1px solid #b91c1c",
                      background: "#fff",
                      color: "#b91c1c",
                      cursor: "pointer",
                    }}
                  >
                    delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
