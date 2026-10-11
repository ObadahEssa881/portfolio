"use client";

import { useRef } from "react";

/**
 * The name, letter by letter. Each letter enters on its own (CSS, so it
 * completes without a script), then reacts to the pointer: the display face
 * has width and weight axes, and the letters nearest the cursor widen and
 * gain weight. Screen readers get the name once, from the aria-label.
 */
export function Name({ lines }: { lines: string[] }) {
  const root = useRef<HTMLHeadingElement>(null);
  let n = 0;

  const move = (x: number) => {
    const el = root.current;
    if (!el || document.documentElement.dataset.motion === "off") return;
    for (const s of el.querySelectorAll<HTMLElement>("[data-l]")) {
      const r = s.getBoundingClientRect();
      const d = Math.abs(x - (r.left + r.width / 2));
      s.style.setProperty("--p", Math.max(0, 1 - d / 220).toFixed(3));
    }
  };
  const leave = () => root.current?.querySelectorAll<HTMLElement>("[data-l]").forEach((s) => s.style.setProperty("--p", "0"));

  return (
    <h1
      ref={root}
      aria-label={lines.join(" ")}
      onPointerMove={(e) => e.pointerType === "mouse" && move(e.clientX)}
      onPointerLeave={leave}
      className="font-display text-[clamp(3.6rem,13vw,10.5rem)] leading-[0.86] font-semibold tracking-[-0.035em] text-bone"
    >
      {lines.map((line, li) => (
        <span key={li} aria-hidden="true" className={li === 1 ? "block ps-[0.06em] text-copper" : "block"}>
          {Array.from(line).map((ch, i) => (
            <span key={i} className="intro-letter" style={{ ["--i" as string]: n++ }}>
              <span
                data-l
                className="inline-block transition-[font-variation-settings,transform] duration-300 ease-out"
                style={{
                  fontVariationSettings: `"wght" calc(560 + var(--p, 0) * 240), "wdth" calc(88 + var(--p, 0) * 12)`,
                  transform: "translateY(calc(var(--p, 0) * -0.05em))",
                }}
              >
                {ch}
              </span>
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
