"use client";

import dynamic from "next/dynamic";
import { SignedIn } from "@insforge/nextjs";

const PdfReaderSettingsPage = dynamic(
() => import("@/components/pdf-reading/pdf-reader-settings"),
  {
    ssr: false,
  }
);

export default function Page() {
  return (
    <SignedIn>
      <PdfReaderSettingsPage />
    </SignedIn>
  );
}
