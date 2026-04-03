import dynamic from "next/dynamic";

//this file generated using Copilot to prevent issues with pdf reading pages being rendered on the server where localStorage can't be accessed (since user settings are stored there)

const PdfReaderPage = dynamic(() => import("@/components/pdf-reading/pdf-reader"), {
  ssr: false
});

export default function Page() {
  return <PdfReaderPage />;
}
