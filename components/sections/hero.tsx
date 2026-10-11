import { Fragment } from "react";
import Image from "next/image";
import { ArrowDown, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GitHubIcon, LinkedInIcon } from "@/components/site/brand-icons";
import { person } from "@/lib/content";
import { Name } from "./name";

export function Hero() {
  return (
    <section id="top" data-span="edge" className="relative flex min-h-[100svh] items-end overflow-hidden md:items-center">
      {/* The still frame, for calm and off: the hero is complete without the 3D. */}
      <Image
        src="/stills/hero.jpg"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="hero-still -z-10 object-cover object-[70%_center] opacity-90"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,var(--void)_8%,color-mix(in_srgb,var(--void)_55%,transparent)_45%,transparent_75%)] md:bg-[linear-gradient(90deg,var(--void)_0%,color-mix(in_srgb,var(--void)_80%,transparent)_34%,transparent_62%)]" />

      <div className="wrap-x relative pt-28 pb-14 md:pb-0">
        <p className="intro eyebrow mb-6 flex flex-wrap items-center gap-x-2 text-dim" style={{ ["--i" as string]: 0 }}>
          <span className="text-ok">GET</span>
          <span className="text-bone/90 normal-case tracking-[0.04em]">/obadah-aboessa</span>
          <span>HTTP/1.1</span>
          <span className="caret -ms-1 text-copper">▍</span>
        </p>

        <Name lines={[person.first, person.last]} />

        <p className="intro mt-7 font-display text-[clamp(1.25rem,2.2vw,1.65rem)] font-medium text-bone" style={{ ["--i" as string]: 3 }}>
          {/* On a phone each half of the title gets its own line, never broken mid-phrase. */}
          {person.role.split(" | ").map((part, i) => (
            <Fragment key={part}>
              {i > 0 && <span className="text-dim max-sm:sr-only"> | </span>}
              <span className="max-sm:block">{part}</span>
            </Fragment>
          ))}
          <span className="text-dim max-sm:hidden"> — </span>
          <span className="text-dim max-sm:mt-1 max-sm:block max-sm:text-[0.8em]">Node.js, NestJS, TypeScript</span>
        </p>
        <p className="intro mt-4 max-w-[36rem] text-[1.05rem] leading-relaxed text-dim" style={{ ["--i" as string]: 4 }}>
          I build the part of a product nobody sees: queues that absorb slow providers, clusters that survive a dead node, and tenants
          that never see each other&rsquo;s data.
        </p>

        <div className="intro mt-8 flex flex-wrap items-center gap-3" style={{ ["--i" as string]: 5 }}>
          <Button asChild size="lg">
            <a href="#system">
              Follow a request
              <ArrowDown />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={`mailto:${person.email}`}>
              <Mail />
              Email
            </a>
          </Button>
          <Button asChild size="icon" variant="outline" className="size-12">
            <a href={person.github} target="_blank" rel="noreferrer" aria-label="GitHub">
              <GitHubIcon className="size-5" />
            </a>
          </Button>
          <Button asChild size="icon" variant="outline" className="size-12">
            <a href={person.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <LinkedInIcon className="size-5" />
            </a>
          </Button>
          <Button asChild size="lg" variant="ghost" className="text-dim hover:text-bone">
            <a href={person.cv} target="_blank" rel="noreferrer">
              <FileText />
              CV (PDF)
            </a>
          </Button>
        </div>

        <p className="intro mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.72rem] text-dim" style={{ ["--i" as string]: 6 }}>
          <span className="flex items-center gap-2">
            <span className="live-dot size-1.5 rounded-full bg-ok" />
            {person.location}
          </span>
          <span aria-hidden="true" className="text-line">/</span>
          <span>Remote</span>
          <span aria-hidden="true" className="text-line">/</span>
          <span>Arabic · English</span>
          <span aria-hidden="true" className="text-line">/</span>
          <span>4 years in backend</span>
        </p>
      </div>

      <p aria-hidden="true" className="absolute right-4 bottom-5 hidden font-mono text-[0.68rem] text-dim md:right-8 md:block">
        scroll — you are the request ↓
      </p>
    </section>
  );
}
