/**
 * Everything the page says about Obadah, in one place.
 *
 * Taken from the CV (public/Obadah_AboEssa_Software_Engineer_CV.pdf). Dates, numbers
 * and claims are the CV's own; nothing here is rounded up. Edit this file to
 * change the copy — the components only lay it out.
 */

export const person = {
  name: "Obadah AboEssa",
  first: "Obadah",
  last: "AboEssa",
  role: "Software Engineer | AI Full Stack Developer",
  location: "Damascus, Syria",
  email: "obadahesa881@gmail.com",
  github: "https://github.com/ObadahEssa881",
  githubHandle: "ObadahEssa881",
  linkedin: "https://www.linkedin.com/in/obadah-abo-essa",
  linkedinHandle: "obadah-abo-essa",
  cv: "/Obadah_AboEssa_Software_Engineer_CV.pdf",
  languages: [
    { name: "Arabic", level: "Native" },
    { name: "English", level: "Fluent (professional working proficiency)" },
  ],
  education: {
    degree: "B.Sc. Software Engineering",
    school: "University of Damascus",
  },
} as const;

export const summary =
  "Backend software engineer with 4 years of experience building backend systems in Node.js, NestJS and TypeScript. I deliver multi-tenant SaaS platforms, queue-driven third-party integrations and OAuth 2.0 / passkey authentication — first as a freelance backend developer, then at Kasroad, building two projects end to end and preparing both for production release. I own data modeling, API design, security review, CI/CD and handover documentation, and I use AI coding agents as a force multiplier to ship full-stack products with a very small team.";

/* ---- the system chapters: one request, five stops ----------------------- */

export interface Chapter {
  id: string;
  span: string;
  title: string;
  body: string;
  facts: string[];
  source: string;
}

export const chapters: Chapter[] = [
  {
    id: "ingress",
    span: "ingress",
    title: "Four instances, one front door.",
    body: "Every request lands on one of four horizontally scaled API instances. None of them is special: lose one and the other three take its traffic. One Docker image, built by GitHub Actions and deployed on every merge to develop — no manual release steps.",
    facts: ["4× API instances", "Docker", "GitHub Actions CI/CD", "OWASP Top 10 review gate"],
    source: "Non-VoIP OTP Number-Leasing Platform · Kasroad",
  },
  {
    id: "queue",
    span: "queue",
    title: "A slow provider fills a queue, not a thread.",
    body: "OTP providers answer when they feel like it. The leasing service puts every provider call on a BullMQ queue backed by Redis, with retries and back-pressure, so slow calls are absorbed instead of passed on. The providers sit behind one adapter interface: swapping one needs no code change.",
    facts: ["BullMQ", "Redis job queues", "retries + back-pressure", "dead-letter handling", "1 adapter, many providers"],
    source: "Non-VoIP OTP Number-Leasing Platform · Kasroad",
  },
  {
    id: "failover",
    span: "redis",
    title: "Kill the primary. It survives.",
    body: "Four Redis instances under Sentinel. When the primary stops answering, the sentinels agree it is gone, promote a replica, and the API instances follow it. Surviving node failure was the requirement — try it.",
    facts: ["4× Redis", "Redis Sentinel failover", "WebSockets", "horizontally scaled Node.js"],
    source: "Non-VoIP OTP Number-Leasing Platform · Kasroad",
  },
  {
    id: "tenancy",
    span: "postgres",
    title: "Shared servers. Separate shops.",
    body: "A white-label e-commerce SaaS hosts many branded storefronts on one infrastructure. Each tenant's data is isolated at the data-access layer, and three role-scoped interfaces — platform admin, store owner and storefront — share a single RBAC model.",
    facts: ["per-tenant isolation", "PostgreSQL + Prisma", "RBAC", "referral & commission engine"],
    source: "XchangeCards · Kasroad",
  },
];

/* ---- the career trace ---------------------------------------------------- */

export type SpanKind = "role" | "education" | "project";

export interface TraceSpan {
  id: string;
  kind: SpanKind;
  /** Rendered as a child row under this span. */
  parent?: string;
  title: string;
  org: string;
  /** The dates exactly as the CV prints them. */
  when: string;
  /** Bar geometry, as [year, month] (month 1–12). Where the CV gives only a
   *  year, the bar covers that year up to the end of the parent role. */
  start: [number, number];
  end: [number, number];
  where?: string;
  stack: string[];
  points: string[];
  links?: { label: string; href: string }[];
}

export const traceStart: [number, number] = [2020, 9];
export const traceEnd: [number, number] = [2026, 9];

export const trace: TraceSpan[] = [
  {
    id: "uod",
    kind: "education",
    title: "B.Sc. Software Engineering",
    org: "University of Damascus — Faculty of Information Technology Engineering",
    when: "Oct 2020 – Aug 2025",
    start: [2020, 10],
    end: [2025, 8],
    where: "Damascus, Syria",
    stack: ["Data Structures", "Algorithms", "Database Systems", "Software Architecture", "Distributed Systems", "Cryptography"],
    points: [
      "Coursework: Data Structures, Algorithms, Database Systems, Software Architecture, Distributed Systems, Cryptography.",
      "Technical moderator on 10+ team projects, leading architecture decisions and reviewing teammates’ code.",
    ],
  },
  {
    id: "pharmacy",
    kind: "project",
    parent: "uod",
    title: "Pharmacy Warehouse Management System",
    org: "Graduation project",
    when: "Oct 2024 – Sep 2025",
    start: [2024, 10],
    end: [2025, 9],
    stack: ["NestJS", "PostgreSQL", "Prisma", "Laravel / Filament PHP"],
    points: [
      "Modeled 15 relational entities across 16 feature modules, to digitize the full stock-to-sale workflow.",
      "Architected a NestJS REST API serving a Laravel / Filament admin panel, with JWT auth and RBAC across 3 roles.",
      "Covered the admin layer with a PHPUnit suite at 85%+ coverage, to keep operational logic regression-safe.",
    ],
    links: [
      { label: "API source", href: "https://github.com/ObadahEssa881/Pharmacy_Warehouse_Management_Sys" },
      { label: "Admin panel source", href: "https://github.com/ObadahEssa881/filament-pharmacy-management-sys" },
    ],
  },
  {
    id: "freelance",
    kind: "role",
    title: "Freelance Backend Developer",
    org: "Independent contract work",
    when: "Jan 2023 – Aug 2025",
    start: [2023, 1],
    end: [2025, 8],
    where: "Damascus, Syria (Remote)",
    stack: ["Node.js", "Express", "NestJS", "Spring Boot", "PHP / Laravel"],
    points: [
      "Delivered REST APIs and relational data layers in Node.js / Express, NestJS and Spring Boot for client and university systems, covering schema design, JWT authentication and OpenAPI documentation.",
      "Translated written requirements into modular, documented services against fixed deadlines, to hand each system over in a state other developers could maintain without me.",
      "Worked across Node.js, PHP / Laravel and Java / Spring Boot to match each client’s existing infrastructure rather than impose a single stack.",
    ],
  },
  {
    id: "signatures",
    kind: "project",
    parent: "freelance",
    title: "Digital Signatures Backend",
    org: "Freelance",
    when: "Apr 2024 – Aug 2024",
    start: [2024, 4],
    end: [2024, 8],
    stack: ["Node.js", "Express.js", "Sequelize", "MySQL", "SHA-256 + RSA"],
    points: [
      "Built a REST API for concurrent document signing on SHA-256 and RSA signatures, to guarantee integrity.",
      "Designed 4 related Sequelize models with foreign-key constraints, to give every signature a full audit trail.",
      "Implemented JWT middleware with role-based validation across modular /sign, /verify and /audit routes.",
    ],
  },
  {
    id: "elearning",
    kind: "project",
    parent: "freelance",
    title: "E-Learning Platform — Spring Boot Microservices",
    org: "Freelance",
    when: "2025",
    start: [2025, 1],
    end: [2025, 8],
    stack: ["Java", "Spring Boot", "Spring Cloud", "Eureka", "JWT", "Gradle"],
    points: [
      "Built 5 independent services behind an API gateway with Eureka service discovery, to scale each domain alone.",
      "Validated JWTs inside every service, not only at the gateway, to keep a service protected if reached directly.",
    ],
    links: [{ label: "Source", href: "https://github.com/ObadahEssa881/spring_boot_microservice_project" }],
  },
  {
    id: "kasroad",
    kind: "role",
    title: "Backend Software Engineer",
    org: "Kasroad",
    when: "Sep 2025 – Aug 2026",
    start: [2025, 9],
    end: [2026, 8],
    where: "Damascus, Syria (Remote)",
    stack: ["Node.js", "NestJS", "PostgreSQL", "Prisma", "Redis", "BullMQ", "Docker"],
    points: [
      "Own backend architecture and delivery for 2 products end to end — data modeling, REST API design, authentication, background processing and deployment.",
      "Orchestrated AI coding agents (Claude, GitHub Copilot, GLM) across backend and frontend repositories to generate and refactor ~90% of production code, cutting feature delivery from weeks to days while personally reviewing every change that ships.",
      "Established an OWASP Top 10 review gate and a GitHub Actions pipeline that builds a single Docker image and deploys on every merge to develop, to remove manual release steps entirely.",
    ],
  },
  {
    id: "otp",
    kind: "project",
    parent: "kasroad",
    title: "Non-VoIP OTP Number-Leasing Platform",
    org: "Kasroad",
    when: "Sep 2025 – Aug 2026",
    start: [2025, 9],
    end: [2026, 8],
    stack: ["Node.js", "BullMQ", "Redis Sentinel", "WebSockets", "Docker", "OAuth 2.0", "Passkeys"],
    points: [
      "Built the leasing service on BullMQ and Redis queues with retries and back-pressure, to absorb slow provider calls.",
      "Deployed 4 horizontally scaled API instances over 4 Redis instances under Sentinel, to survive node failure.",
      "Placed multiple external OTP provider APIs behind 1 adapter interface, to swap providers without code changes.",
    ],
  },
  {
    id: "xchange",
    kind: "project",
    parent: "kasroad",
    title: "XchangeCards — White-Label Multi-Tenant E-Commerce SaaS",
    org: "Kasroad",
    when: "2026",
    start: [2026, 1],
    end: [2026, 8],
    stack: ["Node.js", "PostgreSQL", "Prisma", "RBAC", "Docker"],
    points: [
      "Built per-tenant data isolation at the data-access layer, to host branded storefronts on shared infrastructure.",
      "Engineered a multi-tier referral and commission engine with payout tracking, to reconcile balances exactly.",
      "Shipped 3 role-scoped interfaces — platform admin, store owner and storefront — behind a single RBAC model.",
    ],
  },
];

/* ---- things you can open -------------------------------------------------- */

export const beautyStore = {
  title: "Beauty Store",
  kicker: "Live demo · storefront concept",
  live: "https://beauty-store-lac.vercel.app",
  source: "https://github.com/ObadahEssa881/beauty-store",
  body: "A premium beauty storefront for the Syrian market, Arabic first with English one tap away. A lipstick modelled in three.js uncaps as you scroll and draws one red line through the page; a mirror lets you try a shade on your own skin; every product shows its batch, origin and expiry.",
  stack: ["Next.js 16", "React 19", "TypeScript", "three.js r186", "GSAP", "Lenis", "Tailwind v4", "shadcn/ui", "Zustand"],
};

export interface Repo {
  name: string;
  href: string;
  lang: string;
  note: string;
}

/** Public repositories, described as their own READMEs describe them. */
export const repos: Repo[] = [
  {
    name: "Pharmacy_Warehouse_Management_Sys",
    href: "https://github.com/ObadahEssa881/Pharmacy_Warehouse_Management_Sys",
    lang: "TypeScript",
    note: "NestJS + PostgreSQL / Prisma REST API for pharmacy warehouse management, with JWT auth and route-level RBAC.",
  },
  {
    name: "spring_boot_microservice_project",
    href: "https://github.com/ObadahEssa881/spring_boot_microservice_project",
    lang: "Java",
    note: "E-learning platform as 5 Spring Boot microservices behind an API gateway with Eureka discovery, JWT security and OpenAPI docs.",
  },
  {
    name: "Distributed_system",
    href: "https://github.com/ObadahEssa881/Distributed_system",
    lang: "Java",
    note: "Java RMI file-sharing system — remote coordinator with token-based sessions, MANAGER / EMPLOYEE roles and department-scoped storage.",
  },
  {
    name: "Weather-API-Job-Interview",
    href: "https://github.com/ObadahEssa881/Weather-API-Job-Interview",
    lang: "TypeScript",
    note: "Typed Node.js REST service over OpenWeatherMap — Zod validation, layered client / service / controller, in-memory caching, unified errors.",
  },
  {
    name: "express.ts-auth-jwt-template",
    href: "https://github.com/ObadahEssa881/express.ts-auth-jwt-template",
    lang: "TypeScript",
    note: "Express + TypeScript starter with JWT authentication, Zod validation, bcrypt password hashing and Prisma.",
  },
  {
    name: "fastify-ejs-task-ka-88",
    href: "https://github.com/ObadahEssa881/fastify-ejs-task-ka-88",
    lang: "TypeScript",
    note: "Arabic / English authentication system on Fastify, Prisma, JWT and sessions, with EJS views and protected routes.",
  },
];

/* ---- the stack ------------------------------------------------------------ */

export const skills: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["TypeScript", "JavaScript (ES2022+)", "SQL", "PHP", "Java"] },
  { group: "Backend", items: ["Node.js", "NestJS", "Express.js", "Fastify", "REST API design", "Modular / layered architecture", "WebSockets", "Swagger / OpenAPI"] },
  { group: "Databases & data", items: ["PostgreSQL", "MySQL", "Redis", "Prisma", "Sequelize", "Relational schema design", "Migrations"] },
  { group: "Async & messaging", items: ["BullMQ", "Redis job queues", "Retries and dead-letter handling", "Firebase Cloud Messaging"] },
  { group: "Security & identity", items: ["OAuth 2.0", "Passkeys / WebAuthn", "JWT", "RBAC", "Multi-tenant data isolation", "OWASP Top 10 review", "Zod validation", "SHA-256 + RSA"] },
  { group: "DevOps & infrastructure", items: ["Docker", "GitHub Actions CI/CD", "Horizontally scaled Node.js", "Redis Sentinel failover", "Git / GitHub", "Linux CLI", "Postman", "Structured logging"] },
  { group: "AI-assisted engineering", items: ["Agent orchestration (Claude, GitHub Copilot, GLM)", "Prompt engineering for code generation", "AI-assisted code review and refactoring"] },
];
