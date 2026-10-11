import { person, skills } from "@/lib/content";

export function Stack() {
  return (
    <section id="stack" data-span="serialize" aria-labelledby="stack-title" className="relative bg-void py-24 md:py-32">
      <div className="wrap-x grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div>
          <p data-reveal className="eyebrow text-copper">the stack</p>
          <h2 id="stack-title" data-reveal="1" className="mt-4 text-[clamp(2.2rem,5vw,4rem)] leading-[1.02] tracking-[-0.02em]">
            Tools, by the job they do.
          </h2>
          <p data-reveal="2" className="mt-5 leading-relaxed text-dim">
            Node.js and NestJS are home. I have also shipped on Spring Boot and Laravel when a client&rsquo;s infrastructure already ran on
            them, because matching what is there beats imposing one stack.
          </p>
          <dl data-reveal="3" className="mt-8 space-y-3 border-t border-line pt-6 font-mono text-[0.75rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-dim">education</dt>
              <dd className="text-end text-bone/90">
                {person.education.degree}
                <br />
                <span className="text-dim">{person.education.school}</span>
              </dd>
            </div>
            {person.languages.map((l) => (
              <div key={l.name} className="flex justify-between gap-4">
                <dt className="text-dim">{l.name.toLowerCase()}</dt>
                <dd className="text-end text-bone/90">{l.level}</dd>
              </div>
            ))}
          </dl>
        </div>

        <dl className="divide-y divide-line border-y border-line">
          {skills.map((g, i) => (
            <div key={g.group} data-reveal={i % 3} className="grid gap-2 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
              <dt className="font-mono text-[0.72rem] tracking-[0.08em] text-copper uppercase">{g.group}</dt>
              <dd className="flex flex-wrap gap-x-1 gap-y-1.5 text-[0.98rem] text-bone/85">
                {g.items.map((s, j) => (
                  <span key={s} className="sm:whitespace-nowrap">
                    {s}
                    {j < g.items.length - 1 && <span aria-hidden="true" className="px-1.5 text-line">/</span>}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
