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
    let activePointerId: number | null = null;
    const RESIST = 0.25;
    const CAP = 60;
    const clamp = (v: number) => Math.max(-CAP, Math.min(CAP, v * RESIST));

    const onMove = (e: PointerEvent) => {
      if (!active || e.pointerId !== activePointerId) return;
      // clientX/Y are viewport pixels; translate interprets CSS pixels.
      // Divide by body zoom so the wobble tracks finger 1:1 under zoom.
      const z = parseFloat(getComputedStyle(document.body).zoom);
      const zoom = Number.isFinite(z) && z > 0 ? z : 1;
      const dx = clamp((e.clientX - startX) / zoom);
      const dy = clamp((e.clientY - startY) / zoom);
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };

    const onUp = (e: PointerEvent) => {
      if (!active || e.pointerId !== activePointerId) return;
      active = false;
      activePointerId = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);

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

    const onBlur = () => {
      if (!active) return;
      active = false;
      activePointerId = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      el.style.transition = "transform 200ms ease";
      el.style.transform = "translate(0px, 0px)";
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (active) return;
      e.preventDefault();
      active = true;
      activePointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      el.style.transition = "none";
      el.style.transform = "translate(0px, 0px)";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    };

    handle.addEventListener("pointerdown", onDown);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onBlur);
    return () => {
      handle.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onBlur);
    };
  }, [elementRef, handleRef]);
}
