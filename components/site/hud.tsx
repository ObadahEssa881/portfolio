"use client";

import { useEffect, useRef } from "react";

/**
 * The request you are making, in the corner: which span of the page's trace
 * you are in, and how far into it. Every section declares its span with
 * `data-span`; the HUD reads the one under the middle of the screen.
 */
export function Hud() {
  const span = useRef<HTMLSpanElement>(null);
  const ms = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.innerHeight * 0.5;
      let name = "edge";
      for (const el of document.querySelectorAll<HTMLElement>("[data-span]")) {
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) name = el.dataset.span!;
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (span.current && span.current.textContent !== name) span.current.textContent = name;
      if (ms.current) ms.current.textContent = `${Math.round(p * 1284)} ms`;
      if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
      // the footer is the end of the trace; the HUD steps aside for it
      if (root.current) root.current.style.opacity = p > 0.985 ? "0" : "1";
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none fixed bottom-4 left-4 z-40 hidden transition-opacity duration-300 md:block">
      <div className="overflow-hidden rounded-md border border-line bg-void/70 font-mono text-[0.7rem] text-dim backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 py-1.5 whitespace-nowrap">
          <span className="live-dot size-1.5 rounded-full bg-ok" />
          <span className="text-ok">GET</span>
          <span className="text-bone/85">/obadah-aboessa</span>
          <span className="text-line">│</span>
          <span>span</span>
          <span ref={span} className="text-copper">edge</span>
          <span className="text-line">│</span>
          <span ref={ms} className="num min-w-[7ch] text-end text-bone/85">0 ms</span>
        </div>
        <span ref={bar} className="block h-px origin-left bg-copper" style={{ transform: "scaleX(0)" }} />
      </div>
    </div>
  );
}
