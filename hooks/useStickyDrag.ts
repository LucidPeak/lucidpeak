"use client";

import { useEffect, type RefObject } from "react";

const RESIST = 0.25;
const CAP = 60;

// One drag per element; a second pointerdown mid-drag is ignored.
const activeEls = new WeakSet<HTMLElement>();

/**
 * Rubber-band drag: element follows the pointer with resistance from the
 * given start event, then springs back on release. Attaches its own window
 * listeners and cleans them up; returns a cancel fn that snaps back early,
 * or null if a drag is already active on this element.
 */
export function startStickyDrag(
  el: HTMLElement,
  start: { pointerId: number; clientX: number; clientY: number },
): (() => void) | null {
  if (activeEls.has(el)) return null;
  activeEls.add(el);
  const clamp = (v: number) => Math.max(-CAP, Math.min(CAP, v * RESIST));
  let done = false;

  el.style.transition = "none";
  el.style.transform = "translate(0px, 0px)";

  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== start.pointerId) return;
    // clientX/Y are viewport pixels; translate interprets CSS pixels.
    // Divide by body zoom so the wobble tracks finger 1:1 under zoom.
    const z = parseFloat(getComputedStyle(document.body).zoom);
    const zoom = Number.isFinite(z) && z > 0 ? z : 1;
    const dx = clamp((e.clientX - start.clientX) / zoom);
    const dy = clamp((e.clientY - start.clientY) / zoom);
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const detach = () => {
    done = true;
    activeEls.delete(el);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    window.removeEventListener("blur", cancel);
    document.removeEventListener("visibilitychange", cancel);
  };

  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== start.pointerId) return;
    detach();
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

  const cancel = () => {
    if (done) return;
    detach();
    el.style.transition = "transform 200ms ease";
    el.style.transform = "translate(0px, 0px)";
  };

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  window.addEventListener("blur", cancel);
  document.addEventListener("visibilitychange", cancel);
  return cancel;
}

export function useStickyDrag(
  elementRef: RefObject<HTMLElement | null>,
  handleRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const el = elementRef.current;
    const handle = handleRef.current;
    if (!el || !handle) return;

    let cancelActive: (() => void) | null = null;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      const cancel = startStickyDrag(el, e);
      if (cancel) cancelActive = cancel;
    };

    handle.addEventListener("pointerdown", onDown);
    return () => {
      handle.removeEventListener("pointerdown", onDown);
      cancelActive?.();
    };
  }, [elementRef, handleRef]);
}
