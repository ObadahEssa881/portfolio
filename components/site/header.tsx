import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { person } from "@/lib/content";
import { MotionSwitch } from "./motion-switch";

const NAV = [
  { href: "#system", label: "System" },
  { href: "#trace", label: "Trace" },
  { href: "#work", label: "Work" },
  { href: "#stack", label: "Stack" },
  { href: "#contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/70 bg-void/55 backdrop-blur-md">
      <div className="wrap-x flex h-16 items-center justify-between gap-4">
        <a href="#top" className="group flex items-center gap-2.5" aria-label={`${person.name} — back to top`}>
          <span className="grid size-8 place-items-center rounded-md border border-copper/50 font-display text-[0.8rem] font-bold tracking-tight text-copper transition-colors group-hover:bg-copper group-hover:text-void">
            OA
          </span>
          <span className="hidden font-mono text-[0.78rem] text-bone/85 sm:inline">obadah.aboessa</span>
        </a>
        <nav aria-label="Sections" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="rounded-md px-3 py-2 text-[0.88rem] text-dim transition-colors hover:text-bone">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-3">
          <MotionSwitch />
          <Button asChild size="sm" className="hidden lg:inline-flex">
            <a href={`mailto:${person.email}`}>
              <Mail />
              Email me
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
