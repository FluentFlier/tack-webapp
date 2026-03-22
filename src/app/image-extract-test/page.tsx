"use client"
import { extractImages, getDocumentProxy } from 'unpdf'

async function extractPdfImages(f: File) {

  const pdf = await getDocumentProxy(new Uint8Array(await f.arrayBuffer()))

  // Extract images from page 1
  const imagesData = await extractImages(pdf, 1)
  console.log(`Found ${imagesData.length} images on page 1`)
}
async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      alert("Please upload a PDF file.");
      e.currentTarget.value = "";
      return;
    }
    extractPdfImages(f)
  }



export default function ImageExtractTestPage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl text-gray-600">image-extract-test</h1>
    <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="mt-2"
          />
    </main>
  );
}
