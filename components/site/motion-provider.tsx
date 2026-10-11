"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotionLevel } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth scroll and the reveals, for whichever motion level is on.
 *
 * THE PAGE IS COMPLETE WITHOUT ANY OF THIS. Every element is laid out in its
 * final, readable state by the server; this only ever animates FROM somewhere
 * else to that state, and only after the guards pass (signature-design §6:
 * motion degrades to visible). Everything runs inside one gsap.context, so a
 * change of level reverts it and leaves every element as the server drew it.
 */
export function MotionProvider() {
  const level = useMotionLevel();

  useEffect(() => {
    if (level === null || level === "off") return;
    const undo: (() => void)[] = [];

    if (level === "full") {
      const lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 0.95, anchors: { offset: -72 } });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (t: number) => lenis.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      undo.push(() => {
        gsap.ticker.remove(tick);
        lenis.destroy();
      });
    }

    const ctx = gsap.context(() => {
      // reveal on arrival — fromTo with explicit ends, so a re-run never
      // captures an in-flight value and parks something invisible
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 26 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: "expo.out",
            delay: Number(el.dataset.reveal || 0) * 0.08,
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          },
        );
      });

      // the trace draws itself: every span grows from its start time
      const trace = document.querySelector("#trace [data-waterfall]");
      const bars = gsap.utils.toArray<HTMLElement>("#trace [data-bar]");
      if (trace && bars.length) {
        gsap.fromTo(
          bars,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "power2.out",
            stagger: 0.12,
            transformOrigin: "left center",
            scrollTrigger:
              level === "full"
                ? { trigger: trace, start: "top 85%", end: "center 55%", scrub: 0.8 }
                : { trigger: trace, start: "top 85%", once: true },
            duration: level === "full" ? 1 : 0.9,
          },
        );
      }
    });
    undo.push(() => ctx.revert());
    ScrollTrigger.refresh();

    return () => undo.forEach((f) => f());
  }, [level]);

  return null;
}
