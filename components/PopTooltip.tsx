"use client";

import { useEffect, useRef } from "react";

type Placement = "right" | "top";

type Props = {
  text: string;
  open: boolean;
  onDismiss: () => void;
  placement?: Placement;
  autoDismissMs?: number;
  style?: React.CSSProperties;
};

export function PopTooltip({
  text,
  open,
  onDismiss,
  placement = "top",
  autoDismissMs = 3000,
  style,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(onDismiss, autoDismissMs);
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      onDismiss();
    };
    window.addEventListener("mousedown", onDoc);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("mousedown", onDoc);
    };
  }, [open, onDismiss, autoDismissMs]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      role="tooltip"
      className="pop-tooltip"
      data-placement={placement}
      style={style}
    >
      {text}
    </div>
  );
}
