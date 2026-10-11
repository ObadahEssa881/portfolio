"use client";

import { useSyncExternalStore } from "react";
import { Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bus, type SentinelLine } from "@/lib/bus";
import { cn } from "@/lib/utils";

/** What Sentinel prints when a primary dies — shown as-is when there is no live scene. */
const SAMPLE: SentinelLine[] = [
  { ms: 0, text: "+sdown master redis-1", tone: "fail" },
  { ms: 410, text: "+odown master redis-1 #quorum 3/2", tone: "fail" },
  { ms: 620, text: "+try-failover master redis-1" },
  { ms: 810, text: "+elected-leader sentinel-2", tone: "copper" },
  { ms: 1020, text: "+selected-slave redis-2" },
  { ms: 1640, text: "+promoted-slave redis-2", tone: "copper" },
  { ms: 1700, text: "+switch-master redis-1 → redis-2", tone: "ok" },
  { ms: 4800, text: "-sdown slave redis-1 · back as a replica", tone: "ok" },
];

const TONE = { fail: "text-fail", ok: "text-ok", copper: "text-copper" } as const;

export function FailoverLog() {
  const s = useSyncExternalStore(bus.subscribe, bus.get, bus.get);
  const lines = s.live ? s.lines : SAMPLE;

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-line bg-[#060708]/80">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <span className="font-mono text-[0.68rem] text-dim">sentinel.log</span>
        {s.live && (
          <Button size="sm" variant="outline" disabled={s.busy} onClick={() => bus.kill()} className="h-7 font-mono text-[0.7rem]">
            <Skull />
            {s.busy ? "failing over…" : `kill redis-${s.primary + 1}`}
          </Button>
        )}
      </div>
      <ol aria-live="polite" className="min-h-[9.5rem] space-y-0.5 px-3 py-2.5 font-mono text-[0.7rem] leading-relaxed">
        {lines.length === 0 && <li className="text-dim">all four nodes healthy · primary redis-{s.primary + 1}</li>}
        {lines.map((l, i) => (
          <li key={`${l.ms}-${i}`} className="flex gap-3">
            <span className="num w-[6ch] shrink-0 text-end text-dim">+{l.ms}</span>
            <span className={cn("text-bone/85", l.tone && TONE[l.tone])}>{l.text}</span>
          </li>
        ))}
      </ol>
      {!s.live && (
        <p className="border-t border-line px-3 py-2 font-mono text-[0.66rem] text-dim">Switch motion to 3D to kill the primary yourself.</p>
      )}
    </div>
  );
}
