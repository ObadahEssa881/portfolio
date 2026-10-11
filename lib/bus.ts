/**
 * The smallest possible wire between the page and the 3D scene.
 *
 * The failover card asks the scene to kill the primary; the scene answers with
 * the lines Redis Sentinel would print. Neither side imports the other, so the
 * card works (as a static log) when the scene never loads.
 */

export interface SentinelLine {
  ms: number;
  text: string;
  tone?: "fail" | "ok" | "copper";
}

export interface FailoverState {
  /** The scene is running and listening. */
  live: boolean;
  busy: boolean;
  primary: number;
  lines: SentinelLine[];
}

type Listener = (s: FailoverState) => void;

let state: FailoverState = { live: false, busy: false, primary: 0, lines: [] };
const listeners = new Set<Listener>();
let killHandler: (() => void) | null = null;

export const bus = {
  get: () => state,
  set(next: Partial<FailoverState>) {
    state = { ...state, ...next };
    for (const l of listeners) l(state);
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  /** Registered by the scene while it is alive. */
  onKill(fn: (() => void) | null) {
    killHandler = fn;
    bus.set({ live: fn !== null, busy: false, primary: 0, lines: [] });
  },
  kill() {
    killHandler?.();
  },
};
