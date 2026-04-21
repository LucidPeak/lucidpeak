"use client";

import { useEffect, type RefObject } from "react";

export function useStickyDrag(
  elementRef: RefObject<HTMLElement | null>,
  handleRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const el = elementRef.current;
    const handle = handleRef.current;
    if (!el || !handle) return;

    let startX = 0;
    let startY = 0;
    let active = false;
    const RESIST = 0.25;
    const CAP = 60;
    const clamp = (v: number) => Math.max(-CAP, Math.min(CAP, v * RESIST));

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      active = true;
      startX = e.clientX;
      startY = e.clientY;
      el.style.transition = "none";
      handle.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!active) return;
      const dx = clamp(e.clientX - startX);
      const dy = clamp(e.clientY - startY);
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const onUp = () => {
      if (!active) return;
      active = false;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.style.transition = "none";
        el.style.transform = "";
        return;
      }
      el.style.transition = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = "";
      const clear = () => {
        el.style.transition = "";
        el.removeEventListener("transitionend", clear);
      };
      el.addEventListener("transitionend", clear);
    };

    handle.addEventListener("pointerdown", onDown);
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
    return () => {
      handle.removeEventListener("pointerdown", onDown);
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
    };
  }, [elementRef, handleRef]);
}
