import type { Metadata } from "next";
import { TackSearch } from "./TackSearch";

export const metadata: Metadata = {
  title: "TACK Search — Accessible Web Search",
  description:
    "A keyboard-only, screen-reader-first web search engine for blind and visually impaired users.",
};

export default function TackPage() {
  return <TackSearch />;
}
