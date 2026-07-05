import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contact Us | Tack",
  description:
    "Get in touch with the Tack team for support, feedback, or accessibility questions.",
  openGraph: {
    title: "Contact Us | Tack",
    description:
      "Get in touch with the Tack team for support, feedback, or accessibility questions.",
  },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
