"use client";

import dynamic from "next/dynamic";
import { SignedIn, SignedOut } from "@insforge/nextjs";
import SignInFirst from "@/components/sign-in-first";

//this file generated using Copilot to prevent issues with pdf reading pages being rendered on the server where localStorage can't be accessed (since user settings are stored there)


const PdfReaderSettingsPage = dynamic(
() => import("@/components/pdf-reading/pdf-reader-settings"),
  {
    ssr: false,
  }
);

export default async function Page() {
 

  return <>
    <SignedIn>
      <PdfReaderSettingsPage />
    </SignedIn>
    <SignedOut>
      <SignInFirst />
    </SignedOut>
  </>;
}
