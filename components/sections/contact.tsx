import { ArrowUpRight, FileText } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/site/brand-icons";
import { Magnetic } from "@/components/site/magnetic";
import { person } from "@/lib/content";

/** The response to the request the visitor started at the top of the page. */
export function Contact() {
  return (
    <section id="contact" data-span="response" aria-labelledby="contact-title" className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pt-28 pb-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,var(--void)_35%,color-mix(in_srgb,var(--void)_78%,transparent)_75%,color-mix(in_srgb,var(--void)_55%,transparent))] md:bg-[linear-gradient(90deg,var(--void)_5%,color-mix(in_srgb,var(--void)_75%,transparent)_40%,transparent_70%)]" />
      <div className="wrap-x relative">
        <pre data-reveal className="font-mono text-[0.75rem] leading-relaxed text-dim">
          <span className="text-ok">HTTP/1.1 200 OK</span>
          {"\n"}content-type: engineer/full-stack{"\n"}x-location: {person.location} (remote){"\n"}x-languages: ar, en{"\n"}x-served-by:{" "}
          <span className="text-bone/90">{person.name}</span>
        </pre>
        <h2 id="contact-title" data-reveal="1" className="mt-8 max-w-[16ch] text-[clamp(2.6rem,7vw,6rem)] leading-[0.98] tracking-[-0.03em]">
          Let&rsquo;s build the part nobody sees.
        </h2>
        <p data-reveal="2" className="mt-6 max-w-[36rem] text-[1.05rem] leading-relaxed text-dim">
          Backend roles, contract work, or a system that has to survive its own success — write to me.
        </p>
        <div data-reveal="3" className="mt-10">
          <Magnetic className="[--mx:50%] [--my:50%]">
            <a
              href={`mailto:${person.email}`}
              className="relative inline-flex items-center gap-3 overflow-hidden rounded-xl border border-copper/60 bg-[radial-gradient(160px_circle_at_var(--mx)_var(--my),color-mix(in_srgb,var(--copper)_28%,transparent),transparent_70%)] px-6 py-4 font-display text-[clamp(1.15rem,3vw,2rem)] font-medium tracking-[-0.01em] text-bone transition-colors hover:border-copper"
            >
              {person.email}
              <ArrowUpRight className="size-[0.9em] text-copper" />
            </a>
          </Magnetic>
        </div>
        <ul data-reveal="4" className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-[0.95rem]">
          <li>
            <a href={person.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-bone/85 hover:text-copper">
              <GitHubIcon className="size-4" />
              github.com/{person.githubHandle}
            </a>
          </li>
          <li>
            <a href={person.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-bone/85 hover:text-copper">
              <LinkedInIcon className="size-4" />
              linkedin.com/in/{person.linkedinHandle}
            </a>
          </li>
          <li>
            <a href={person.cv} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-bone/85 hover:text-copper">
              <FileText className="size-4" />
              CV, as a PDF
            </a>
          </li>
        </ul>
      </div>
      <footer className="wrap-x relative mt-20 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 font-mono text-[0.66rem] text-dim">
        <span>© {new Date().getFullYear()} {person.name}</span>
        <span>Next.js · three.js · GSAP · Tailwind · shadcn/ui — every texture painted in code</span>
      </footer>
    </section>
  );
}
