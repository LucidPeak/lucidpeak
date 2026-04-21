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
}: Props) {
  const dragState = useRef<{ dx: number; dy: number } | null>(null);
  const isLive = !app.comingSoon && !!app.href;

  const handleTitlePointerDown = (e: React.PointerEvent) => {
    if (stacked) return;
    if (maximized) return;
    onFocus();
    const target = e.currentTarget as HTMLDivElement;
    target.setPointerCapture(e.pointerId);
    dragState.current = { dx: e.clientX - x, dy: e.clientY - y };

    const onMoveHandler = (ev: PointerEvent) => {
      if (!dragState.current) return;
      const desk = desktopRef.current;
      const bounds = desk?.getBoundingClientRect();
      let nx = ev.clientX - dragState.current.dx;
      let ny = ev.clientY - dragState.current.dy;
      if (bounds) {
        const maxX = bounds.width - 60;
        const maxY = bounds.height - 40;
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

  const style: React.CSSProperties = stacked
    ? {}
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

  return (
    <div
      className="win-chrome absolute"
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
          onDoubleClick={onMaximizeToggle}
          onClose={onClose}
          onMinimize={onMinimize}
          onMaximize={onMaximizeToggle}
          isLive={isLive}
        />
        <div className="flex-1 overflow-auto">
          <WindowBody app={app} />
        </div>
      </div>
    </div>
  );
}
