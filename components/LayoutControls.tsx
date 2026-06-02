"use client";

import { useEffect, useRef, useState } from "react";

type Values = {
  rootPt: number;
  rowGap: number;
  sectionGap: number;
  taglineSize: number;
  taglineOpacity: number;
  shiplogHeight: number;
  terminalTx: number;
  terminalTy: number;
  shiplogTx: number;
  shiplogTy: number;
  cardSecret1Fx: number;
  cardSecret1Fy: number;
  cardLettermatchFx: number;
  cardLettermatchFy: number;
  cardIssueaggregatorFx: number;
  cardIssueaggregatorFy: number;
  cardSecret2Fx: number;
  cardSecret2Fy: number;
};

const DEFAULTS: Values = {
  rootPt: 25,
  rowGap: 39,
  sectionGap: 11,
  taglineSize: 21,
  taglineOpacity: 0.3,
  shiplogHeight: 250,
  terminalTx: -68,
  terminalTy: 4,
  shiplogTx: -68,
  shiplogTy: 4,
  cardSecret1Fx: 0.12,
  cardSecret1Fy: 0.69,
  cardLettermatchFx: 0.95,
  cardLettermatchFy: 0.15,
  cardIssueaggregatorFx: 0.76,
  cardIssueaggregatorFy: 0.57,
  cardSecret2Fx: 0.32,
  cardSecret2Fy: 0.46,
};

const STORAGE_KEY = "lp:layout-controls";
const OPEN_KEY = "lp:layout-controls-open";
const POS_KEY = "lp:layout-controls-pos";

type Pos = { x: number; y: number } | null;

function toCssVarMap(v: Values): Record<string, string> {
  return {
    "--lc-root-pt": `${v.rootPt}px`,
    "--lc-row-gap": `${v.rowGap}px`,
    "--lc-section-gap": `${v.sectionGap}px`,
    "--lc-tagline-size": `${v.taglineSize}px`,
    "--lc-tagline-opacity": String(v.taglineOpacity),
    "--lc-shiplog-height": `${v.shiplogHeight}px`,
    "--lc-terminal-tx": `${v.terminalTx}px`,
    "--lc-terminal-ty": `${v.terminalTy}px`,
    "--lc-shiplog-tx": `${v.shiplogTx}px`,
    "--lc-shiplog-ty": `${v.shiplogTy}px`,
    "--lc-card-secret1-fx": String(v.cardSecret1Fx),
    "--lc-card-secret1-fy": String(v.cardSecret1Fy),
    "--lc-card-lettermatch-fx": String(v.cardLettermatchFx),
    "--lc-card-lettermatch-fy": String(v.cardLettermatchFy),
    "--lc-card-issueaggregator-fx": String(v.cardIssueaggregatorFx),
    "--lc-card-issueaggregator-fy": String(v.cardIssueaggregatorFy),
    "--lc-card-secret2-fx": String(v.cardSecret2Fx),
    "--lc-card-secret2-fy": String(v.cardSecret2Fy),
  };
}

export function LayoutControls() {
  const [values, setValues] = useState<Values>(DEFAULTS);
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [pos, setPos] = useState<Pos>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setValues({ ...DEFAULTS, ...parsed });
      }
      const rawOpen = window.localStorage.getItem(OPEN_KEY);
      if (rawOpen) setOpen(rawOpen === "1");
      const rawPos = window.localStorage.getItem(POS_KEY);
      if (rawPos) {
        const p = JSON.parse(rawPos);
        if (
          p &&
          typeof p.x === "number" &&
          typeof p.y === "number" &&
          Number.isFinite(p.x) &&
          Number.isFinite(p.y)
        ) {
          setPos(p);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (pos) {
        window.localStorage.setItem(POS_KEY, JSON.stringify(pos));
      } else {
        window.localStorage.removeItem(POS_KEY);
      }
    } catch {}
  }, [pos, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    const map = toCssVarMap(values);
    for (const [k, v] of Object.entries(map)) {
      root.style.setProperty(k, v);
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {}
    window.dispatchEvent(new CustomEvent("lp:relayout"));
  }, [values, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(OPEN_KEY, open ? "1" : "0");
    } catch {}
  }, [open, hydrated]);

  const set = <K extends keyof Values>(key: K, val: Values[K]) =>
    setValues((v) => ({ ...v, [key]: val }));

  const reset = () => setValues(DEFAULTS);

  const onHeadPointerDown = (e: React.PointerEvent) => {
    // ignore clicks on buttons inside the header
    if ((e.target as HTMLElement).closest("button")) return;
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = pos?.x ?? rect.left;
    const y = pos?.y ?? rect.top;
    if (!pos) setPos({ x, y });
    dragState.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: x,
      origY: y,
    };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onHeadPointerMove = (e: React.PointerEvent) => {
    const d = dragState.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const nx = d.origX + (e.clientX - d.startX);
    const ny = d.origY + (e.clientY - d.startY);
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 40;
    setPos({
      x: Math.max(-260, Math.min(maxX, nx)),
      y: Math.max(0, Math.min(maxY, ny)),
    });
  };

  const onHeadPointerUp = (e: React.PointerEvent) => {
    const d = dragState.current;
    if (!d || e.pointerId !== d.pointerId) return;
    dragState.current = null;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const copy = async () => {
    const map = toCssVarMap(values);
    const block = `:root {\n${Object.entries(map)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join("\n")}\n}\n`;
    try {
      await navigator.clipboard.writeText(block);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  if (!open) {
    return (
      <button
        type="button"
        className="lc-toggle"
        onClick={() => setOpen(true)}
      >
        layout ▸
      </button>
    );
  }

  const panelStyle: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
    : {};

  return (
    <div ref={panelRef} className="lc-panel" style={panelStyle}>
      <div
        className="lc-head"
        onPointerDown={onHeadPointerDown}
        onPointerMove={onHeadPointerMove}
        onPointerUp={onHeadPointerUp}
        onPointerCancel={onHeadPointerUp}
      >
        <span className="lc-title lc-grip">⋮⋮ layout controls</span>
        <div className="lc-actions">
          <button type="button" onClick={reset}>
            reset
          </button>
          <button type="button" onClick={copy}>
            {copied ? "✓ copied" : "copy css"}
          </button>
          <button type="button" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>
      </div>
      <div className="lc-body">
        <Slider
          label="root pt"
          min={0}
          max={200}
          step={1}
          value={values.rootPt}
          onChange={(v) => set("rootPt", v)}
          unit="px"
        />
        <Slider
          label="section gap"
          min={0}
          max={48}
          step={1}
          value={values.sectionGap}
          onChange={(v) => set("sectionGap", v)}
          unit="px"
        />
        <Slider
          label="row gap"
          min={0}
          max={80}
          step={1}
          value={values.rowGap}
          onChange={(v) => set("rowGap", v)}
          unit="px"
        />
        <div className="lc-group">tagline</div>
        <Slider
          label="size"
          min={10}
          max={48}
          step={1}
          value={values.taglineSize}
          onChange={(v) => set("taglineSize", v)}
          unit="px"
        />
        <Slider
          label="opacity"
          min={0}
          max={1}
          step={0.05}
          value={values.taglineOpacity}
          onChange={(v) => set("taglineOpacity", v)}
          unit=""
        />
        <div className="lc-group">terminal</div>
        <Slider
          label="tx"
          min={-200}
          max={120}
          step={1}
          value={values.terminalTx}
          onChange={(v) => set("terminalTx", v)}
          unit="px"
        />
        <Slider
          label="ty"
          min={-80}
          max={120}
          step={1}
          value={values.terminalTy}
          onChange={(v) => set("terminalTy", v)}
          unit="px"
        />
        <div className="lc-group">ship log</div>
        <Slider
          label="height"
          min={120}
          max={480}
          step={2}
          value={values.shiplogHeight}
          onChange={(v) => set("shiplogHeight", v)}
          unit="px"
        />
        <Slider
          label="tx"
          min={-200}
          max={120}
          step={1}
          value={values.shiplogTx}
          onChange={(v) => set("shiplogTx", v)}
          unit="px"
        />
        <Slider
          label="ty"
          min={-80}
          max={120}
          step={1}
          value={values.shiplogTy}
          onChange={(v) => set("shiplogTy", v)}
          unit="px"
        />
        <div className="lc-group">cards (0 = left/top, 1 = right/bottom)</div>
        <CardSliders
          label="secret #1"
          fx={values.cardSecret1Fx}
          fy={values.cardSecret1Fy}
          onFx={(v) => set("cardSecret1Fx", v)}
          onFy={(v) => set("cardSecret1Fy", v)}
        />
        <CardSliders
          label="lettermatch"
          fx={values.cardLettermatchFx}
          fy={values.cardLettermatchFy}
          onFx={(v) => set("cardLettermatchFx", v)}
          onFy={(v) => set("cardLettermatchFy", v)}
        />
        <CardSliders
          label="issueaggregator"
          fx={values.cardIssueaggregatorFx}
          fy={values.cardIssueaggregatorFy}
          onFx={(v) => set("cardIssueaggregatorFx", v)}
          onFy={(v) => set("cardIssueaggregatorFy", v)}
        />
        <CardSliders
          label="secret #2"
          fx={values.cardSecret2Fx}
          fy={values.cardSecret2Fy}
          onFx={(v) => set("cardSecret2Fx", v)}
          onFy={(v) => set("cardSecret2Fy", v)}
        />
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  unit,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  unit: string;
}) {
  return (
    <label className="lc-slider">
      <span className="lc-lbl">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="lc-val">
        {step < 1 ? value.toFixed(2) : value}
        {unit}
      </span>
    </label>
  );
}

function CardSliders({
  label,
  fx,
  fy,
  onFx,
  onFy,
}: {
  label: string;
  fx: number;
  fy: number;
  onFx: (v: number) => void;
  onFy: (v: number) => void;
}) {
  return (
    <div className="lc-card">
      <span className="lc-lbl lc-card-lbl">{label}</span>
      <Slider
        label="fx"
        min={0}
        max={1}
        step={0.01}
        value={fx}
        onChange={onFx}
        unit=""
      />
      <Slider
        label="fy"
        min={0}
        max={1}
        step={0.01}
        value={fy}
        onChange={onFy}
        unit=""
      />
    </div>
  );
}
