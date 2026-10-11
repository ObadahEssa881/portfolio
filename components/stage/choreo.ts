import type { SceneInput } from "./cluster-scene";

/**
 * Where the camera is, read from the page's own scroll (threejs skill,
 * recipes/scroll.md §2: native scroll into plain numbers, never React state).
 *
 * The page's sections ARE the scene's acts: each system chapter is a tall
 * article, and the camera holds on that chapter's part of the cluster while
 * the article is on screen, drifting a little so a held pose is never a still.
 * Between articles it flies to the next part. Positions are re-measured on
 * resize, so the copy and the camera cannot drift apart.
 */

interface Pose {
  px: number;
  py: number;
  pz: number;
  lx: number;
  ly: number;
  lz: number;
}

const P = (px: number, py: number, pz: number, lx: number, ly: number, lz: number): Pose => ({ px, py, pz, lx, ly, lz });

/* Each chapter has an arriving pose and a leaving pose; the camera drifts between them. */
const HERO = P(-7, 11.5, 22, 0.8, 0.4, 0);
const CHAPTERS: [Pose, Pose][] = [
  [P(-15.5, 4.6, 9.5, -7.6, 1.0, 0), P(-12.5, 5.6, 11, -7.2, 1.0, 0.4)], // ingress
  [P(0.5, 5.2, 9.5, 5.4, 0.6, 0.2), P(3.4, 5.8, 9.8, 6.4, 0.6, 0)], // queue
  [P(-1.2, 7.4, 6.8, 0.5, 1.5, -7.0), P(2.2, 7.8, 7.0, 0.5, 1.5, -7.0)], // failover
  [P(-6.5, 5.0, 14.5, 1.2, 1.5, 6.8), P(-3.5, 6.0, 15.5, 1.2, 1.5, 6.8)], // tenancy
];
const READING = P(2, 26, 24, 1, 0, 0);
const FINALE = P(6, 12.5, 23, 0.5, 0.3, 0);

const smooth = (t: number) => t * t * (3 - 2 * t);
const ramp = (x: number, a: number, b: number) => (b === a ? (x >= b ? 1 : 0) : smooth(Math.min(1, Math.max(0, (x - a) / (b - a)))));

interface Key {
  at: number;
  pose: Pose;
}

export interface Reading {
  input: SceneInput;
  /** 0..1 opacity of the whole stage. */
  alpha: number;
  /** 0..1 progress through the current chapter. */
  local: number;
}

export function createChoreo() {
  let keys: Key[] = [];
  let chapterSpans: [number, number][] = [];
  let systemEnd = 0;
  let contactTop = Infinity;
  let vh = 1;
  let phone = false;
  let lastY = -1;
  let speed = 0;

  const abs = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, h: r.height };
  };

  function refresh() {
    vh = window.innerHeight;
    phone = window.innerWidth < 900;
    keys = [{ at: 0, pose: HERO }];
    chapterSpans = [];
    const arts = Array.from(document.querySelectorAll("[data-chapter]"));
    arts.forEach((el, i) => {
      const { top, h } = abs(el);
      const a = top - 0.3 * vh;
      const b = Math.max(a + 1, top + h - vh);
      chapterSpans.push([top, top + h]);
      const [A, B] = CHAPTERS[i] ?? CHAPTERS[CHAPTERS.length - 1];
      keys.push({ at: a, pose: A }, { at: b, pose: B });
    });
    const sys = document.getElementById("system");
    systemEnd = sys ? abs(sys).top + abs(sys).h : vh;
    const contact = document.getElementById("contact");
    contactTop = contact ? abs(contact).top : Infinity;
    keys.push({ at: systemEnd + 0.4 * vh, pose: READING });
    if (Number.isFinite(contactTop)) {
      keys.push({ at: contactTop - 0.9 * vh, pose: READING }, { at: contactTop - 0.15 * vh, pose: FINALE });
    }
    keys.sort((x, y) => x.at - y.at);
  }

  const input: SceneInput = { ...HERO, offX: 0, offY: 0, chapter: -1, traffic: 0, tenancy: 0, finale: 0 };

  function read(dt: number): Reading {
    const y = window.scrollY;
    if (lastY < 0) lastY = y;
    const v = dt > 0 ? Math.abs(y - lastY) / dt : 0;
    lastY = y;
    speed += (v - speed) * (1 - Math.pow(0.02, dt));

    // the pose: smooth between the two keys around the scroll position
    let a = keys[0];
    let b = keys[keys.length - 1];
    if (y <= a.at) b = a;
    else if (y >= b.at) a = b;
    else
      for (let i = 0; i < keys.length - 1; i++)
        if (y >= keys[i].at && y <= keys[i + 1].at) {
          a = keys[i];
          b = keys[i + 1];
          break;
        }
    const t = a === b || b.at === a.at ? 0 : smooth((y - a.at) / (b.at - a.at));
    for (const k of ["px", "py", "pz", "lx", "ly", "lz"] as const) input[k] = a.pose[k] + (b.pose[k] - a.pose[k]) * t;

    // portrait screens see less sideways: pull back along the line of sight
    const aspect = window.innerWidth / Math.max(1, vh);
    if (aspect < 1.2) {
      const f = 1 + (1.2 - aspect) * 0.95;
      input.px = input.lx + (input.px - input.lx) * f;
      input.py = input.ly + (input.py - input.ly) * f;
      input.pz = input.lz + (input.pz - input.lz) * f;
    }
    // the copy sits at the start side on desks, at the bottom on phones
    input.offX = phone ? 0 : 0.17;
    input.offY = phone ? 0.2 : 0;

    // which chapter holds the middle of the screen
    const mid = y + vh * 0.5;
    let chapter = mid < (chapterSpans[0]?.[0] ?? Infinity) ? -1 : 4;
    let local = 0;
    chapterSpans.forEach(([top, end], i) => {
      if (mid >= top && mid < end) {
        chapter = i;
        local = (mid - top) / (end - top);
      }
    });
    const finale = ramp(y, contactTop - 0.9 * vh, contactTop - 0.2 * vh);
    if (finale > 0.5) chapter = 5;
    input.chapter = chapter;
    input.finale = finale;
    const t3 = chapterSpans[3]?.[0] ?? Infinity;
    input.tenancy = ramp(y, t3 - 0.6 * vh, t3 - 0.1 * vh) * (1 - ramp(y, systemEnd - 0.3 * vh, systemEnd + 0.3 * vh));
    input.traffic = Math.min(48, speed * 0.025);

    const alpha = Math.max(1 - ramp(y, systemEnd - 0.45 * vh, systemEnd + 0.25 * vh), ramp(y, contactTop - 0.95 * vh, contactTop - 0.35 * vh));
    return { input, alpha, local };
  }

  return { refresh, read };
}
