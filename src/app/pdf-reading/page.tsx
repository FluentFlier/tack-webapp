"use client";

import dynamic from "next/dynamic";
import { SignedIn, SignedOut } from "@insforge/nextjs";
import SignInFirst from "@/components/sign-in-first";

//this file generated using Copilot to prevent issues with pdf reading pages being rendered on the server where localStorage can't be accessed (since user settings are stored there)

const PdfReaderPage = dynamic(() => import("@/components/pdf-reading/pdf-reader"), {
  ssr: false
});

export default async function Page() {
 
  return <>
  <SignedIn>
    <PdfReaderPage />
  </SignedIn>
  <SignedOut>
    <SignInFirst />
  </SignedOut>
  </>;
}
