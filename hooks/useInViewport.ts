"use client";

import { useEffect, useState, type RefObject } from "react";

/** True while the ref's element is within rootMargin of the viewport.
 *  Defaults to true (SSR / no IntersectionObserver). */
export function useInViewport(
  ref: RefObject<Element | null>,
  rootMargin = "120px",
) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);

  return visible;
}
