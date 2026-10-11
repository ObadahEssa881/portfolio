import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { chapters } from "@/lib/content";
import { FailoverLog } from "./failover-log";

/**
 * The spine of the page. Each article is one stop of a request, and the 3D
 * cluster behind it flies to that part of the system while it is on screen.
 * The numbering is honest: this IS a sequence — the order a request meets
 * these parts.
 */
export function System() {
  return (
    <section id="system" aria-labelledby="system-title" className="relative">
      <div className="wrap-x pt-24 md:pt-32">
        <p data-reveal className="eyebrow text-copper">one request, four stops</p>
        <h2 id="system-title" data-reveal="1" className="mt-4 max-w-[22ch] text-[clamp(2.2rem,5vw,4rem)] leading-[1.02] tracking-[-0.02em]">
          Backend work is invisible. So here is a request, going through systems I built.
        </h2>
        <p data-reveal="2" className="mt-5 max-w-[42rem] text-[1.05rem] leading-relaxed text-dim">
          Everything behind this text is drawn from my CV: the instance count, the queue, the Sentinel failover, the tenant isolation.
          Scroll faster and you send more traffic — watch the queue take it.
        </p>
      </div>

      {chapters.map((c, i) => (
        <article key={c.id} id={c.id} data-chapter={i} data-span={c.span} aria-labelledby={`${c.id}-title`} className="relative min-h-[150svh] md:min-h-[175vh]">
          <div className="wrap-x pt-[46svh] md:sticky md:top-[16vh] md:pt-0">
            <div className="grid items-start gap-6 md:grid-cols-[minmax(0,30rem)_1fr]">
              <div className="rounded-xl border border-line bg-void/75 p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-md md:p-7">
                <p className="eyebrow flex items-center gap-3 text-dim">
                  <span className="num text-copper">0{i + 1}</span>
                  <span className="h-px w-6 bg-line" />
                  <span>span · {c.span}</span>
                </p>
                <h3 id={`${c.id}-title`} className="mt-4 text-[clamp(1.6rem,2.6vw,2.15rem)] leading-[1.08] tracking-[-0.015em]">
                  {c.title}
                </h3>
                <p className="mt-4 leading-relaxed text-bone/80">{c.body}</p>
                <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Facts">
                  {c.facts.map((f) => (
                    <li key={f}>
                      <Badge>{f}</Badge>
                    </li>
                  ))}
                </ul>
                {c.id === "failover" && <FailoverLog />}
                <p className="mt-5 border-t border-line pt-3 font-mono text-[0.68rem] text-dim">from: {c.source}</p>
              </div>
              {/* The still frame of this stop, for calm and off. */}
              <Image
                src={`/stills/${c.id}.jpg`}
                alt=""
                aria-hidden="true"
                width={1600}
                height={1000}
                sizes="(min-width: 900px) 50vw, 100vw"
                className="still order-first w-full rounded-xl border border-line object-cover md:order-none md:mt-10"
              />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
