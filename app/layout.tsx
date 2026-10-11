import type { Metadata, Viewport } from "next";
import { Header } from "@/components/site/header";
import { Hud } from "@/components/site/hud";
import { MotionProvider } from "@/components/site/motion-provider";
import { Stage } from "@/components/stage/stage";
import { person } from "@/lib/content";
import { fontVars } from "@/lib/fonts";
import { MOTION_SCRIPT } from "@/lib/motion";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const description =
  "Backend engineer in Node.js, NestJS and TypeScript: queue-driven integrations, Redis Sentinel failover, multi-tenant SaaS, OAuth 2.0 and passkeys. Damascus, Syria — remote.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${person.name} — ${person.role}`,
  description,
  authors: [{ name: person.name, url: person.github }],
  keywords: ["backend engineer", "Node.js", "NestJS", "TypeScript", "PostgreSQL", "Redis", "BullMQ", "Docker", "Syria", "remote"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    title: `${person.name} — ${person.role}`,
    description,
    url: "/",
    siteName: person.name,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: `${person.name} — ${person.role}`, description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#090b0c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVars} suppressHydrationWarning>
      <head>
        {/* Before the first paint: the motion level, and whether WebGL exists. */}
        <script dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />
      </head>
      <body>
        <a
          href="#system"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-md focus:bg-copper focus:px-3 focus:py-2 focus:text-void"
        >
          Skip to content
        </a>
        <Stage />
        <Header />
        <main className="relative z-10">{children}</main>
        <Hud />
        <MotionProvider />
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
