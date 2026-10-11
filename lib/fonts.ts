import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";

/*
 * Three faces, a system rather than a pairing (signature-design §5):
 * display with character, a quiet UI face, and a mono for everything a
 * machine would print — spans, timings, status lines.
 * next/font downloads them at build time and serves them from this site,
 * so no visitor's browser waits on a font host.
 */
export const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-disp",
  display: "swap",
});
export const ui = Instrument_Sans({ subsets: ["latin"], variable: "--font-ui", display: "swap" });
export const utility = JetBrains_Mono({ subsets: ["latin"], variable: "--font-utility", display: "swap" });

export const fontVars = [display, ui, utility].map((f) => f.variable).join(" ");
