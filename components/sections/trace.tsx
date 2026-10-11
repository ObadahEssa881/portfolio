"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { trace, traceEnd, traceStart, type TraceSpan } from "@/lib/content";
import { cn } from "@/lib/utils";

const month = ([y, m]: [number, number]) => y * 12 + (m - 1);
const T0 = month(traceStart);
const T1 = month(traceEnd);
const pct = (ym: [number, number]) => ((month(ym) - T0) / (T1 - T0)) * 100;
const YEARS = Array.from({ length: traceEnd[0] - traceStart[0] }, (_, i) => traceStart[0] + 1 + i);

/** Recent first, each parent followed by its children. */
const ROWS = (() => {
  const roots = trace.filter((s) => !s.parent).sort((a, b) => month(b.start) - month(a.start));
  return roots.flatMap((r) => [r, ...trace.filter((s) => s.parent === r.id).sort((a, b) => month(b.start) - month(a.start))]);
})();

const KIND = {
  role: { label: "role", bar: "bg-copper", dot: "bg-copper" },
  education: { label: "education", bar: "bg-[var(--tenant-b)]", dot: "bg-[var(--tenant-b)]" },
  project: { label: "project", bar: "bg-bone/25 ring-1 ring-inset ring-bone/45", dot: "bg-bone/60" },
} as const;

const hasMonths = (s: TraceSpan) => /[A-Z][a-z]{2} \d{4}/.test(s.when);
const months = (s: TraceSpan) => month(s.end) - month(s.start) + 1;

export function Trace() {
  const [sel, setSel] = useState("kasroad");
  const span = useMemo(() => trace.find((s) => s.id === sel)!, [sel]);
  const parent = span.parent ? trace.find((s) => s.id === span.parent) : undefined;

  return (
    <section id="trace" data-span="compose" aria-labelledby="trace-title" className="relative bg-void py-24 md:py-36">
      <div className="wrap-x">
        <p data-reveal className="eyebrow text-copper">
          trace <span className="text-dim normal-case">7f3a9c21 · 8 spans · Oct 2020 → Aug 2026</span>
        </p>
        <h2 id="trace-title" data-reveal="1" className="mt-4 text-[clamp(2.2rem,5vw,4rem)] leading-[1.02] tracking-[-0.02em]">
          Six years, one trace.
        </h2>
        <p data-reveal="2" className="mt-5 max-w-[40rem] text-[1.05rem] leading-relaxed text-dim">
          Every span is real: a role, a degree, or a system I shipped inside one. Pick a span to read its attributes.
        </p>

        <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-10">
          {/* the waterfall */}
          <div data-waterfall className="min-w-0">
            <div className="grid grid-cols-[minmax(0,12rem)_1fr] gap-x-4 border-b border-line pb-2 font-mono text-[0.66rem] text-dim sm:grid-cols-[minmax(0,19rem)_1fr]">
              <span>span</span>
              <div className="relative h-4">
                {YEARS.map((y) => (
                  <span key={y} className="absolute -translate-x-1/2" style={{ left: `${pct([y, 1])}%` }}>
                    {`’${String(y).slice(2)}`}
                  </span>
                ))}
              </div>
            </div>
            <ul className="mt-1" aria-label="Career spans">
              {ROWS.map((s) => {
                const on = s.id === sel;
                const k = KIND[s.kind];
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      aria-controls="span-detail"
                      onClick={() => setSel(s.id)}
                      className={cn(
                        "group grid w-full grid-cols-[minmax(0,12rem)_1fr] items-center gap-x-4 rounded-md px-0 py-2.5 text-start transition-colors sm:grid-cols-[minmax(0,19rem)_1fr]",
                        on ? "bg-plate" : "hover:bg-plate/60",
                      )}
                    >
                      <span className={cn("flex min-w-0 items-center gap-2 ps-2", s.parent && "ps-6")}>
                        {s.parent && <span aria-hidden="true" className="-ms-3 h-3 w-2 shrink-0 rounded-bl-sm border-b border-l border-line" />}
                        <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", k.dot)} />
                        <span className="min-w-0">
                          <span className={cn("line-clamp-2 block text-[0.9rem] leading-snug", on ? "text-bone" : "text-bone/80 group-hover:text-bone")}>
                            {s.kind === "role" ? `${s.title} — ${s.org}` : s.title}
                          </span>
                          <span className="mt-0.5 block font-mono text-[0.64rem] text-dim">{s.when}</span>
                        </span>
                      </span>
                      <span className="relative block h-7">
                        {YEARS.map((y) => (
                          <span key={y} aria-hidden="true" className="absolute inset-y-0 w-px bg-line/60" style={{ left: `${pct([y, 1])}%` }} />
                        ))}
                        <span
                          data-bar
                          className={cn("absolute top-1/2 h-2.5 -translate-y-1/2 rounded-[3px]", k.bar, on && "shadow-[0_0_0_2px_var(--void),0_0_0_3px_var(--copper)]")}
                          style={{ left: `${pct(s.start)}%`, width: `${Math.max(1.2, pct(s.end) - pct(s.start) + 100 / (T1 - T0))}%` }}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.66rem] text-dim">
              {(Object.keys(KIND) as (keyof typeof KIND)[]).map((k) => (
                <span key={k} className="flex items-center gap-2">
                  <span aria-hidden="true" className={cn("h-2 w-4 rounded-[2px]", KIND[k].bar)} />
                  {KIND[k].label}
                </span>
              ))}
            </p>
          </div>

          {/* the span's attributes */}
          <div id="span-detail" aria-live="polite" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <article className="rounded-xl border border-line bg-plate p-6 md:p-7">
              <p className="eyebrow flex items-center gap-2 text-dim">
                <span aria-hidden="true" className={cn("size-1.5 rounded-full", KIND[span.kind].dot)} />
                span · {KIND[span.kind].label}
              </p>
              <h3 className="mt-3 text-[1.55rem] leading-[1.12] tracking-[-0.01em]">{span.title}</h3>
              <p className="mt-1.5 text-dim">{span.org}</p>

              <dl className="mt-5 grid grid-cols-[7.5rem_1fr] gap-y-1.5 border-y border-line py-4 font-mono text-[0.72rem]">
                <dt className="text-dim">when</dt>
                <dd className="text-bone/90">
                  {span.when}
                  {hasMonths(span) && <span className="text-dim"> · {months(span)} months</span>}
                </dd>
                {span.where && (
                  <>
                    <dt className="text-dim">where</dt>
                    <dd className="text-bone/90">{span.where}</dd>
                  </>
                )}
                {parent && (
                  <>
                    <dt className="text-dim">parent</dt>
                    <dd>
                      <button type="button" onClick={() => setSel(parent.id)} className="text-copper underline-offset-4 hover:underline">
                        {parent.kind === "role" ? `${parent.title} — ${parent.org}` : parent.title}
                      </button>
                    </dd>
                  </>
                )}
              </dl>

              <ul className="mt-5 space-y-3">
                {span.points.map((p) => (
                  <li key={p} className="flex gap-3 leading-relaxed text-bone/85">
                    <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-copper" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Stack">
                {span.stack.map((t) => (
                  <li key={t}>
                    <Badge>{t}</Badge>
                  </li>
                ))}
              </ul>

              {span.links && (
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                  {span.links.map((l) => (
                    <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[0.9rem] text-copper underline-offset-4 hover:underline">
                      {l.label}
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  ))}
                </div>
              )}
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
