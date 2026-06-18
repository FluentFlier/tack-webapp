"use client";

import dynamic from "next/dynamic";
import { SignedIn } from "@insforge/nextjs";

const PdfReaderPage = dynamic(() => import("@/components/pdf-reading/pdf-reader"), {
  ssr: false
});

export default function Page() {
  return (
    <SignedIn>
      <PdfReaderPage />
    </SignedIn>
  );
}
