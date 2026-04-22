"use client";

import { TrafficLights } from "./TrafficLights";

type Props = {
  title: string;
  onPointerDown: (e: React.PointerEvent) => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onDoubleClick?: () => void;
  isLive?: boolean;
  locked?: boolean;
};

export function TitleBar({
  title,
  onPointerDown,
  onClose,
  onMinimize,
  onMaximize,
  onDoubleClick,
  isLive = false,
  locked = false,
}: Props) {
  return (
    <div
      className="win-titlebar group relative flex h-9 shrink-0 items-center gap-3 px-3 select-none"
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
    >
      {locked ? (
        <div className="traffic-lights flex items-center gap-[8px]" aria-hidden>
          <span className="traffic-dot traffic-close" />
          <span className="traffic-dot traffic-min" />
          <span className="traffic-dot traffic-max" />
        </div>
      ) : (
        <TrafficLights
          onClose={onClose}
          onMinimize={onMinimize}
          onMaximize={onMaximize}
        />
      )}
      {isLive && (
        <span
          aria-label="Live"
          title="Live"
          className="live-dot ml-1 inline-block h-[7px] w-[7px] rounded-full bg-emerald-500"
        />
      )}
      <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[12px] font-medium text-zinc-500">
        {title}
      </span>
    </div>
  );
}
