"use client";

import { useEffect } from "react";

/** Fades `.reveal` elements in as they enter the viewport, once each. */
export function useReveal() {
  useEffect(() => {
    const observeAll = () => {
      const els = document.querySelectorAll<HTMLElement>(".reveal:not(.in)");
      if (!els.length) return;
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting || e.intersectionRatio > 0) {
              e.target.classList.add("in");
              io.unobserve(e.target);
            }
          }),
        { threshold: 0.01, rootMargin: "50px 0px" },
      );
      els.forEach((el) => io.observe(el));
      return io;
    };

    const io = observeAll();
    // Fallback pass in case elements render after initial frame
    const timer = setTimeout(() => {
      document.querySelectorAll<HTMLElement>(".reveal:not(.in)").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100) {
          el.classList.add("in");
        }
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      io?.disconnect();
    };
  }, []);
}
