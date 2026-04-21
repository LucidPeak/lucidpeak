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

    let activePointerId: number | null = null;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (active) return;
      active = true;
      activePointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      el.style.transition = "none";
      el.style.transform = "translate(0px, 0px)";
      handle.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!active || e.pointerId !== activePointerId) return;
      const dx = clamp(e.clientX - startX);
      const dy = clamp(e.clientY - startY);
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const onUp = (e: PointerEvent) => {
      if (!active || e.pointerId !== activePointerId) return;
      active = false;
      activePointerId = null;
      try {
        handle.releasePointerCapture?.(e.pointerId);
      } catch {}
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.style.transition = "";
        el.style.transform = "";
        return;
      }
      el.style.transition = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)";
      requestAnimationFrame(() => {
        el.style.transform = "translate(0px, 0px)";
      });
      const clear = (ev: TransitionEvent) => {
        if (ev.propertyName !== "transform") return;
        el.style.transition = "";
        el.style.transform = "";
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
