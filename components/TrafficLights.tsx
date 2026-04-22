"use client";

type Props = {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
};

export function TrafficLights({ onClose, onMinimize, onMaximize }: Props) {
  const stop = (e: React.PointerEvent) => e.stopPropagation();
  return (
    <div
      className="traffic-lights flex items-center gap-[8px]"
      onPointerDown={stop}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="traffic-dot traffic-close"
      >
        <svg viewBox="0 0 10 10" aria-hidden>
          <path d="M2.5 2.5 L7.5 7.5 M7.5 2.5 L2.5 7.5" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Minimize"
        onClick={onMinimize}
        className="traffic-dot traffic-min"
      >
        <svg viewBox="0 0 10 10" aria-hidden>
          <path d="M2 5 H8" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Maximize"
        onClick={onMaximize}
        className="traffic-dot traffic-max"
      >
        <svg viewBox="0 0 10 10" aria-hidden>
          <path d="M5 2 V8 M2 5 H8" />
        </svg>
      </button>
    </div>
  );
}
