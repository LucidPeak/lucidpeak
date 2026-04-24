"use client";

import type { App } from "@/content/apps";
import { TitleBar } from "./TitleBar";
import { WindowBody } from "./WindowBody";
import { useRef } from "react";

type Props = {
  app: App;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  focused: boolean;
  minimized: boolean;
  maximized: boolean;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximizeToggle: () => void;
  desktopRef: React.RefObject<HTMLDivElement | null>;
  stacked?: boolean;
  sticky?: boolean;
  dimmed?: boolean;
  locked?: boolean;
};

export function Window({
  app,
  x,
  y,
  z,
  width,
  height,
  focused,
  minimized,
  maximized,
  onFocus,
  onMove,
  onClose,
  onMinimize,
  onMaximizeToggle,
  desktopRef,
  stacked = false,
  sticky = false,
  dimmed = false,
  locked = false,
}: Props) {
  const dragState = useRef<{ dx: number; dy: number } | null>(null);
  const winRef = useRef<HTMLDivElement | null>(null);
  const isLive = !app.comingSoon && !!app.href;

  const handleTitlePointerDown = (e: React.PointerEvent) => {
    if (stacked) return;
    // Pointer events report clientX/Y in viewport pixels while style.left/top
    // and transform translates are interpreted in CSS pixels. Under `body { zoom }`
    // those two spaces diverge by the zoom factor — divide to stay consistent.
    const bodyZoom = (() => {
      const z = parseFloat(getComputedStyle(document.body).zoom);
      return Number.isFinite(z) && z > 0 ? z : 1;
    })();
    if (sticky) {
      const el = winRef.current;
      if (!el) return;
      e.preventDefault();
      const pointerId = e.pointerId;
      const startX = e.clientX;
      const startY = e.clientY;
      el.style.transition = "none";
      el.style.transform = "translate(0px, 0px)";
      const clamp = (v: number) => Math.max(-60, Math.min(60, v * 0.25));
      const onMoveStick = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        const dx = (ev.clientX - startX) / bodyZoom;
        const dy = (ev.clientY - startY) / bodyZoom;
        el.style.transform = `translate(${clamp(dx)}px, ${clamp(dy)}px)`;
      };
      const onUpStick = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        window.removeEventListener("pointermove", onMoveStick);
        window.removeEventListener("pointerup", onUpStick);
        window.removeEventListener("pointercancel", onUpStick);
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          el.style.transition = "";
          el.style.transform = "";
          return;
        }
        el.style.transition = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)";
        requestAnimationFrame(() => {
          el.style.transform = "translate(0px, 0px)";
        });
      };
      window.addEventListener("pointermove", onMoveStick);
      window.addEventListener("pointerup", onUpStick);
      window.addEventListener("pointercancel", onUpStick);
      return;
    }
    if (maximized) return;
    onFocus();
    const target = e.currentTarget as HTMLDivElement;
    target.setPointerCapture(e.pointerId);
    dragState.current = {
      dx: e.clientX / bodyZoom - x,
      dy: e.clientY / bodyZoom - y,
    };

    const onMoveHandler = (ev: PointerEvent) => {
      if (!dragState.current) return;
      const desk = desktopRef.current;
      let nx = ev.clientX / bodyZoom - dragState.current.dx;
      let ny = ev.clientY / bodyZoom - dragState.current.dy;
      if (desk) {
        const maxX = desk.offsetWidth - 60;
        const maxY = desk.offsetHeight - 40;
        if (nx < -width + 120) nx = -width + 120;
        if (nx > maxX) nx = maxX;
        if (ny < 0) ny = 0;
        if (ny > maxY) ny = maxY;
      }
      onMove(nx, ny);
    };
    const onUp = () => {
      dragState.current = null;
      target.removeEventListener("pointermove", onMoveHandler);
      target.removeEventListener("pointerup", onUp);
      target.removeEventListener("pointercancel", onUp);
    };
    target.addEventListener("pointermove", onMoveHandler);
    target.addEventListener("pointerup", onUp);
    target.addEventListener("pointercancel", onUp);
  };

  const style: React.CSSProperties =
    stacked || sticky
      ? sticky
        ? {
            opacity: minimized ? 0 : 1,
            pointerEvents: minimized ? "none" : "auto",
            transition: "opacity 220ms ease",
          }
        : {}
      : maximized
        ? {
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            zIndex: z,
            transition: "all 220ms cubic-bezier(0.22,1,0.36,1)",
          }
        : {
            left: x,
            top: y,
            width,
            height,
            zIndex: z,
            transform: minimized
              ? "translateY(60px) scale(0.7)"
              : "translateY(0) scale(1)",
            opacity: minimized ? 0 : 1,
            pointerEvents: minimized ? "none" : "auto",
            transition:
              "transform 260ms cubic-bezier(0.22,1,0.36,1), opacity 220ms ease",
          };

  const posClass = stacked || sticky ? "" : "absolute";
  const dimClass = dimmed ? "is-dimmed" : "";

  return (
    <div
      ref={winRef}
      className={`win-chrome ${posClass} ${dimClass}`.trim()}
      style={style}
      onPointerDown={onFocus}
      role="dialog"
      aria-label={app.name}
      aria-hidden={minimized}
    >
      <div className="relative z-[1] flex h-full flex-col overflow-hidden rounded-[22px] soft-card">
        <TitleBar
          title={app.name}
          onPointerDown={handleTitlePointerDown}
          onDoubleClick={locked ? undefined : onMaximizeToggle}
          onClose={onClose}
          onMinimize={onMinimize}
          onMaximize={onMaximizeToggle}
          isLive={isLive}
          locked={locked}
        />
        <div className="flex-1 overflow-auto">
          <WindowBody app={app} />
        </div>
      </div>
    </div>
  );
}
