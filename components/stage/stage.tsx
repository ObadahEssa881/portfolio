"use client";

import { useEffect, useRef } from "react";
import type * as ThreeNS from "three";
import { bus } from "@/lib/bus";
import { useMotionLevel, webglFailed } from "@/lib/motion";
import { createClusterScene, type ClusterScene } from "./cluster-scene";
import { createChoreo } from "./choreo";

/**
 * One fixed, transparent canvas behind the page, holding the cluster.
 *
 * Mounted only at motion level "full". `three` is imported here, at runtime,
 * so it is its own chunk: a visitor at "calm" or "off" — and every crawler —
 * downloads none of it and sees the still frames the sections carry instead.
 *
 * The lifecycle is omni-channel's `useThreeScene`, written for a full-screen
 * stage: capped pixel ratio, paused while the tab is hidden, `dt` clamped so a
 * stall never teleports anything, and everything the GPU holds freed on
 * unmount. While the reading sections cover it, it stops drawing altogether.
 */
export function Stage() {
  const level = useMotionLevel();
  if (level !== "full") return null;
  return <LiveStage />;
}

function LiveStage() {
  const host = useRef<HTMLDivElement | null>(null);
  const labels = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = host.current;
    const layer = labels.current;
    if (!el || !layer || webglFailed()) return;
    let disposed = false;
    let raf = 0;
    let renderer: ThreeNS.WebGLRenderer | null = null;
    let scene: ClusterScene | null = null;
    const cleanups: (() => void)[] = [];

    import("three")
      .then((THREE) => {
        if (disposed) return;
        const phone = window.matchMedia("(max-width: 900px)").matches;
        const pr = Math.min(window.devicePixelRatio || 1, phone ? 1.75 : 2);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(pr);
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.setAttribute("aria-hidden", "true");
        el.prepend(renderer.domElement);

        const built = createClusterScene(THREE, renderer, {
          packets: phone ? 520 : 900,
          pixelRatio: pr,
          events: {
            onLine: (line) => bus.set({ lines: [...bus.get().lines, line] }),
            onBusy: (busy, primary) => bus.set(busy ? { busy, primary, lines: [] } : { busy, primary }),
          },
        });
        scene = built.api;
        const { scene: three, camera } = built;
        bus.onKill(() => scene?.kill());
        cleanups.push(() => bus.onKill(null));

        // one label element per anchor the scene publishes
        const nodes = scene.anchors.map(() => {
          const s = document.createElement("span");
          s.className = "scene-label";
          s.style.opacity = "0";
          layer.appendChild(s);
          return s;
        });
        cleanups.push(() => nodes.forEach((n) => n.remove()));

        const choreo = createChoreo();
        const size = () => {
          renderer!.setSize(window.innerWidth, window.innerHeight);
          scene!.resize(window.innerWidth, window.innerHeight);
          choreo.refresh();
        };
        size();
        window.addEventListener("resize", size);
        cleanups.push(() => window.removeEventListener("resize", size));
        // fonts, images and the reveals all move section heights after load
        const ro = new ResizeObserver(() => choreo.refresh());
        ro.observe(document.body);
        cleanups.push(() => ro.disconnect());

        renderer.compile(three, camera);

        let last = 0;
        let t = 0;
        // A system already in production: run four seconds of traffic before
        // the first frame, so the cluster is busy the moment it fades in.
        {
          const { input } = choreo.read(0);
          for (let i = 0; i < 240; i++) {
            t += 1 / 60;
            scene.frame(1 / 60, t, input);
          }
        }
        if (process.env.NODE_ENV !== "production") {
          // dev only: step simulated time, for browsers too slow to run it (headless checks)
          Object.assign(window, {
            __advance: (sec: number) => {
              for (let i = 0; i < sec * 60; i++) {
                t += 1 / 60;
                const { input } = choreo.read(1 / 60);
                const still = (window as { __still?: { x: number; y: number } }).__still;
                if (still) {
                  input.offX = still.x;
                  input.offY = still.y;
                }
                scene!.frame(1 / 60, t, input);
              }
            },
          });
        }
        let shown = 0;
        let autoKilled = false;
        const loop = (now: number) => {
          raf = requestAnimationFrame(loop);
          const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
          last = now;
          t += dt;
          const { input, alpha, local } = choreo.read(dt);
          if (process.env.NODE_ENV !== "production") {
            // dev only: centre the subject, for rendering the still frames
            const still = (window as { __still?: { x: number; y: number } }).__still;
            if (still) {
              input.offX = still.x;
              input.offY = still.y;
            }
          }
          shown += (alpha - shown) * (1 - Math.pow(0.0005, dt));
          if (shown < 0.004 && alpha === 0) {
            el.style.opacity = "0";
            el.style.visibility = "hidden";
            return;
          }
          el.style.visibility = "visible";
          el.style.opacity = shown.toFixed(3);

          // the failover chapter kills the primary once, a beat after arriving
          if (input.chapter === 2 && local > 0.32 && !autoKilled) {
            autoKilled = true;
            scene!.kill();
          }
          if (input.chapter !== 2 && !bus.get().busy) autoKilled = false;

          scene!.frame(dt, t, input);
          renderer!.render(three, camera);

          const anchors = scene!.anchors;
          for (let i = 0; i < anchors.length; i++) {
            const a = anchors[i];
            const n = nodes[i];
            if (n.textContent !== a.text) n.textContent = a.text;
            if ((n.dataset.tone ?? "") !== a.tone) n.dataset.tone = a.tone;
            // on a phone the hero's words fill the screen: no names over them
            const show = a.show && !(phone && input.chapter === -1);
            n.style.opacity = show ? "1" : "0";
            if (show) n.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0) translate(-50%, -100%)`;
          }
        };
        const sync = () => {
          cancelAnimationFrame(raf);
          if (!document.hidden) {
            last = 0;
            raf = requestAnimationFrame(loop);
          }
        };
        document.addEventListener("visibilitychange", sync);
        cleanups.push(() => document.removeEventListener("visibilitychange", sync));
        sync();
      })
      .catch(() => {
        // No WebGL after all, or the chunk did not load: show the stills.
        document.documentElement.dataset.webgl = "fail";
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanups.forEach((f) => f());
      scene?.dispose();
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, []);

  return (
    <div ref={host} className="stage" aria-hidden="true" style={{ opacity: 0 }}>
      <div ref={labels} className="absolute inset-0 overflow-hidden" />
    </div>
  );
}
