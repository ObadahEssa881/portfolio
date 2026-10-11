"use client";

import { useRef, type ReactNode } from "react";

/**
 * A magnetic CTA (signature-design §8): the element leans toward the pointer
 * and a radial light follows it. Off at motion level "off" and on touch.
 */
export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const el = useRef<HTMLSpanElement>(null);
  const still = () => document.documentElement.dataset.motion === "off";
  return (
    <span
      ref={el}
      className={className}
      style={{ display: "inline-block", transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)" }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || still() || !el.current) return;
        const r = el.current.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        el.current.style.setProperty("--mx", `${x}px`);
        el.current.style.setProperty("--my", `${y}px`);
        el.current.style.transform = `translate(${(x - r.width / 2) * 0.12}px, ${(y - r.height / 2) * 0.25}px)`;
      }}
      onPointerLeave={() => {
        if (el.current) el.current.style.transform = "";
      }}
    >
      {children}
    </span>
  );
}
