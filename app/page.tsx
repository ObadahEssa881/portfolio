import { Contact } from "@/components/sections/contact";
import { Hero } from "@/components/sections/hero";
import { Stack } from "@/components/sections/stack";
import { System } from "@/components/sections/system";
import { Trace } from "@/components/sections/trace";
import { Work } from "@/components/sections/work";
import { beautyStore, person, summary } from "@/lib/content";
import { siteUrl } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: person.name,
  jobTitle: person.role,
  description: summary,
  email: `mailto:${person.email}`,
  url: siteUrl,
  address: { "@type": "PostalAddress", addressLocality: "Damascus", addressCountry: "SY" },
  alumniOf: { "@type": "CollegeOrUniversity", name: person.education.school },
  knowsLanguage: ["ar", "en"],
  sameAs: [person.github, person.linkedin, beautyStore.live],
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero />
      <System />
      <Trace />
      <Work />
      <Stack />
      <Contact />
    </>
  );
}
