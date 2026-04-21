"use client";

import { useEffect, useState } from "react";

type Shape = {
  width: number;
  height: number;
  radius: number;
  offsetX: number;
  offsetY: number;
};

const DEFAULTS: Shape = {
  width: 300,
  height: 380,
  radius: 22,
  offsetX: 0,
  offsetY: 0,
};

const STORAGE_KEY = "lp:terminal-shape";

function readStored(): Shape {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Shape>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function applyShape(s: Shape) {
  const root = document.documentElement;
  root.style.setProperty("--term-w", `${s.width}px`);
  root.style.setProperty("--term-h", `${s.height}px`);
  root.style.setProperty("--term-r", `${s.radius}px`);
  root.style.setProperty("--term-dx", `${s.offsetX}px`);
  root.style.setProperty("--term-dy", `${s.offsetY}px`);
}

export function TerminalShapeControls() {
  const [shape, setShape] = useState<Shape>(DEFAULTS);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = readStored();
    setShape(initial);
    applyShape(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyShape(shape);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shape));
    } catch {}
  }, [shape, mounted]);

  if (!mounted) return null;

  const reset = () => setShape(DEFAULTS);

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 99999,
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            background: "#1a1614",
            color: "#f5ede0",
            border: "1px solid rgba(201,167,106,0.7)",
            borderRadius: 999,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.3,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          }}
        >
          shape
        </button>
      )}
      {open && (
        <div
          style={{
            background: "#1a1614",
            color: "#f5ede0",
            border: "1px solid rgba(201,167,106,0.7)",
            borderRadius: 12,
            padding: 14,
            width: 260,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.2,
              color: "#c9a76a",
              textTransform: "uppercase",
            }}
          >
            <span>Terminal shape</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#c9a76a",
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
                padding: 0,
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <Slider
            label="width"
            value={shape.width}
            min={220}
            max={700}
            step={5}
            onChange={(v) => setShape((s) => ({ ...s, width: v }))}
          />
          <Slider
            label="height"
            value={shape.height}
            min={240}
            max={820}
            step={5}
            onChange={(v) => setShape((s) => ({ ...s, height: v }))}
          />
          <Slider
            label="radius"
            value={shape.radius}
            min={0}
            max={40}
            step={1}
            onChange={(v) => setShape((s) => ({ ...s, radius: v }))}
          />
          <Slider
            label="offset X"
            value={shape.offsetX}
            min={-200}
            max={200}
            step={1}
            onChange={(v) => setShape((s) => ({ ...s, offsetX: v }))}
          />
          <Slider
            label="offset Y"
            value={shape.offsetY}
            min={-200}
            max={200}
            step={1}
            onChange={(v) => setShape((s) => ({ ...s, offsetY: v }))}
          />

          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 10,
              fontSize: 11,
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                flex: 1,
                background: "transparent",
                color: "#f5ede0",
                border: "1px solid rgba(245,237,224,0.25)",
                borderRadius: 6,
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              reset
            </button>
            <button
              type="button"
              onClick={async () => {
                const snippet =
                  `.terminal-outside { width: ${shape.width}px; height: ${shape.height}px; transform: translate(${shape.offsetX}px, ${shape.offsetY}px); }\n` +
                  `.terminal-outside .soft-card { border-radius: ${shape.radius}px; }`;
                try {
                  await navigator.clipboard.writeText(snippet);
                } catch {}
              }}
              style={{
                flex: 1,
                background: "#c9a76a",
                color: "#1a1614",
                border: "none",
                borderRadius: 6,
                padding: "6px 10px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              copy CSS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label
      style={{
        display: "block",
        marginBottom: 8,
        fontSize: 11,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 3,
          color: "#a8998a",
        }}
      >
        <span>{label}</span>
        <span style={{ color: "#f5ede0", fontFamily: "ui-monospace, monospace" }}>
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#c9a76a" }}
      />
    </label>
  );
}
