# Obadah AboEssa — portfolio

A backend engineer's work is invisible: it is what happens between a click and
a response. So this page makes the visitor's scroll **one request travelling
through the systems on the CV** — load-balanced across four API instances,
queued in BullMQ behind a provider adapter, surviving a dead Redis primary
under Sentinel, kept inside its tenant in Postgres — and it ends as a
`200 OK` with an email address in it.

## The page

| Section | What it is |
|---|---|
| **Hero** | The request line, the name (letters react to the pointer on the display face's width and weight axes), and the cluster behind it. |
| **System** | Four chapters, one per stop of the request. The 3D camera flies to that part of the cluster while each chapter is on screen. Scrolling faster sends more traffic: watch the queue fill and back-pressure hold the overflow at the API instances. In the Redis chapter the primary is killed (or kill it yourself) and `sentinel.log` prints what Sentinel would. |
| **Trace** | The career as a distributed trace: roles, degree and projects as spans on a 2020–2026 axis. Pick a span to read its attributes. |
| **Work** | The live Beauty Store (<https://beauty-store-lac.vercel.app>) and the public repositories. |
| **Stack** | Skills grouped by the job they do. |
| **Contact** | The response: `HTTP/1.1 200 OK`, the email, GitHub, LinkedIn and the CV. |

The **motion switch** in the header has three levels: **3D** (the live
cluster, smooth scroll), **Calm** (gentle reveals, no WebGL — each chapter shows
a still frame instead) and **Off** (a still page with the same words). Visitors
whose OS asks for reduced motion start at Off. Their choice is remembered.

## Stack

Next.js 16 (App Router, fully static) · React 19 · TypeScript · Tailwind CSS v4
· shadcn/ui (Radix) · three.js r186 · GSAP + ScrollTrigger · Lenis.

The 3D is vanilla three.js loaded as its own chunk, only at the 3D level; no
models or HDRIs are downloaded — the machined modules, the Damascus-steel grain,
the machine-room environment and the floor grid are all painted in code
(`components/stage/cluster-scene.ts`).

## Editing

All the words live in **`lib/content.ts`** — summary, chapters, trace spans,
projects, repositories and skills. The components only lay them out.

The still frames in `public/stills/` and the Beauty Store screenshot in
`public/work/` were rendered from the live pages; if the scene changes, re-render
them (open the page in a browser with motion at 3D, hide the page content, and
capture the canvas at each chapter).

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
npm run lint && npm run typecheck
```

## Deploy to Vercel

Import the repository in Vercel and deploy — no environment variables are
needed. The site's canonical URL is taken from Vercel's
`VERCEL_PROJECT_PRODUCTION_URL`; set `NEXT_PUBLIC_SITE_URL` if you use a custom
domain.
