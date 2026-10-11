import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/site/brand-icons";
import { beautyStore, person, repos } from "@/lib/content";

const LANG: Record<string, string> = { TypeScript: "bg-[#3178c6]", Java: "bg-[#e08a4f]", PHP: "bg-[#8892bf]" };

export function Work() {
  return (
    <section id="work" data-span="render" aria-labelledby="work-title" className="relative bg-void py-24 md:py-32">
      <div className="wrap-x">
        <p data-reveal className="eyebrow text-copper">things you can open</p>
        <h2 id="work-title" data-reveal="1" className="mt-4 max-w-[20ch] text-[clamp(2.2rem,5vw,4rem)] leading-[1.02] tracking-[-0.02em]">
          Don&rsquo;t take the trace&rsquo;s word for it.
        </h2>
        <p data-reveal="2" className="mt-5 max-w-[40rem] text-[1.05rem] leading-relaxed text-dim">
          The Kasroad systems are private. These are not: a live front end, and the public repositories behind the trace.
        </p>

        {/* the live one */}
        <article data-reveal className="group mt-14 grid overflow-hidden rounded-2xl border border-line bg-plate lg:grid-cols-[1.25fr_1fr]">
          <a
            href={beautyStore.live}
            target="_blank"
            rel="noreferrer"
            className="relative block aspect-[16/10] overflow-hidden border-b border-line bg-[#140b0e] lg:aspect-auto lg:min-h-[26rem] lg:border-e lg:border-b-0"
            aria-label="Open the Beauty Store live site"
          >
            <Image
              src="/work/beauty-store.jpg"
              alt="The Beauty Store home page: the headline “Real beauty, from the source.” beside an uncapped red lipstick among rose petals"
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <span className="absolute top-4 left-4 flex items-center gap-2 rounded-md border border-line bg-void/80 px-2.5 py-1 font-mono text-[0.68rem] text-bone backdrop-blur">
              <span className="live-dot size-1.5 rounded-full bg-ok" />
              live · vercel
            </span>
          </a>
          <div className="flex flex-col p-6 md:p-8">
            <p className="eyebrow text-dim">{beautyStore.kicker}</p>
            <h3 className="mt-3 text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.05] tracking-[-0.015em]">{beautyStore.title}</h3>
            <p className="mt-4 leading-relaxed text-bone/80">{beautyStore.body}</p>
            <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Stack">
              {beautyStore.stack.map((t) => (
                <li key={t}>
                  <Badge>{t}</Badge>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap gap-3 pt-7">
              <Button asChild>
                <a href={beautyStore.live} target="_blank" rel="noreferrer">
                  Open the live site
                  <ArrowUpRight />
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={beautyStore.source} target="_blank" rel="noreferrer">
                  <GitHubIcon />
                  Source
                </a>
              </Button>
            </div>
          </div>
        </article>

        {/* the public repositories */}
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repos.map((r, i) => (
            <li key={r.name} data-reveal={i % 3}>
              <a
                href={r.href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full flex-col rounded-xl border border-line bg-plate/60 p-5 transition-colors hover:border-copper/50 hover:bg-plate"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0 font-mono text-[0.8rem] break-all text-bone">{r.name}</span>
                  <ArrowUpRight className="size-4 shrink-0 text-dim transition-colors group-hover:text-copper" />
                </span>
                <span className="mt-3 text-[0.9rem] leading-relaxed text-dim">{r.note}</span>
                <span className="mt-auto flex items-center gap-2 pt-4 font-mono text-[0.66rem] text-dim">
                  <span aria-hidden="true" className={`size-2 rounded-full ${LANG[r.lang] ?? "bg-dim"}`} />
                  {r.lang}
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p data-reveal className="mt-6">
          <a href={person.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-mono text-[0.8rem] text-copper underline-offset-4 hover:underline">
            everything else on github.com/{person.githubHandle}
            <ArrowUpRight className="size-3.5" />
          </a>
        </p>
      </div>
    </section>
  );
}
