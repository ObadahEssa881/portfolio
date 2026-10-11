import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { person } from "@/lib/content";

export const alt = `${person.name} — ${person.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The card a shared link shows: the request line, the name, the response. */
export default async function OpengraphImage() {
  // the cluster, as the live page shows it, behind the words
  const still = await readFile(join(process.cwd(), "public/stills/hero.jpg"));
  const bg = `data:image/jpeg;base64,${still.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#090b0c",
          backgroundImage: `linear-gradient(90deg, rgba(9,11,12,0.97) 0%, rgba(9,11,12,0.82) 42%, rgba(9,11,12,0.2) 80%), url(${bg})`,
          backgroundSize: "100% 100%, 1200px 750px",
          backgroundPosition: "0 0, 180px -60px",
          color: "#ece7de",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", gap: 14, fontSize: 26, color: "#929a96", fontFamily: "monospace" }}>
          <span style={{ color: "#6fe3a8" }}>GET</span>
          <span style={{ color: "#ece7de" }}>/obadah-aboessa</span>
          <span>HTTP/1.1</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 132, fontWeight: 700, letterSpacing: -5, lineHeight: 0.9 }}>{person.first}</div>
          <div style={{ fontSize: 132, fontWeight: 700, letterSpacing: -5, lineHeight: 0.9, color: "#e08a4f" }}>{person.last}</div>
          <div style={{ marginTop: 34, fontSize: 36, color: "#ece7de" }}>{person.role}</div>
        </div>
        <div style={{ display: "flex", gap: 18, fontSize: 24, color: "#929a96", fontFamily: "monospace" }}>
          <span style={{ color: "#6fe3a8" }}>200 OK</span>
          <span>queues · failover · multi-tenant SaaS</span>
          <span>{`· ${person.location}`}</span>
        </div>
      </div>
    ),
    size,
  );
}
