"use client";

import { useSyncExternalStore } from "react";

/**
 * One motion control, as a ladder (signature-design §7):
 *   full — the 3D cluster, smooth scroll, scrubbed choreography
 *   calm — reveals and hovers only; no canvas, no smooth scroll
 *   off  — a still page, identical words
 *
 * The level lives on <html data-motion>, set by an inline script in <head>
 * before the first paint (MOTION_SCRIPT), so CSS never shows a frame of the
 * wrong mode. A visitor who asked their OS for reduced motion starts at "off";
 * the switch in the header lets anyone pick for themselves, and remembers.
 */

export type MotionLevel = "full" | "calm" | "off";
export const MOTION_KEY = "oa-motion";
const EVENT = "oa-motion-change";

export const MOTION_SCRIPT = `(function(){var d=document.documentElement;try{var s=null;try{s=localStorage.getItem("${MOTION_KEY}")}catch(e){}var r=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;d.dataset.motion=(s==="full"||s==="calm"||s==="off")?s:(r?"off":"full");var c=document.createElement("canvas"),g=null;try{g=c.getContext("webgl2")||c.getContext("webgl")}catch(e){}if(!g)d.dataset.webgl="fail"}catch(e){d.dataset.motion="calm"}})();`;

const read = (): MotionLevel => {
  const v = document.documentElement.dataset.motion;
  return v === "calm" || v === "off" ? v : "full";
};

export function setMotionLevel(level: MotionLevel) {
  document.documentElement.dataset.motion = level;
  try {
    localStorage.setItem(MOTION_KEY, level);
  } catch {
    /* private mode: the choice lasts for this page only */
  }
  window.dispatchEvent(new Event(EVENT));
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
};

/** The current level. `null` on the server and during hydration. */
export function useMotionLevel(): MotionLevel | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export const webglFailed = () => document.documentElement.dataset.webgl === "fail";
