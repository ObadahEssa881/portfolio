"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { setMotionLevel, useMotionLevel, type MotionLevel } from "@/lib/motion";

const LEVELS: { value: MotionLevel; label: string; hint: string }[] = [
  { value: "full", label: "3D", hint: "Full motion: the live 3D cluster and smooth scroll" },
  { value: "calm", label: "Calm", hint: "Calm: gentle reveals, no 3D" },
  { value: "off", label: "Off", hint: "Off: a still page" },
];

/** The one motion control. The server renders it with nothing pressed. */
export function MotionSwitch() {
  const level = useMotionLevel();
  return (
    <div className="flex items-center gap-2">
      <span className="eyebrow hidden text-[0.62rem] text-dim lg:inline">motion</span>
      <ToggleGroup
        type="single"
        size="sm"
        value={level ?? ""}
        onValueChange={(v) => v && setMotionLevel(v as MotionLevel)}
        aria-label="Motion"
        className="border border-line bg-void/50"
      >
        {LEVELS.map((l) => (
          <ToggleGroupItem key={l.value} value={l.value} aria-label={l.hint} title={l.hint} className="px-2.5 font-mono text-[0.68rem] data-[state=on]:text-copper">
            {l.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
