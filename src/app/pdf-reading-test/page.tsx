"use client";

import React, { useState } from "react";
import { configurePdfJsWorker } from "@/lib/pdfjs-worker";

type RenderedPage = {
  pageNumber: number;
  src: string;
  width: number;
  height: number;
};

export default function PdfReadingTestPage() {
  const [fileName, setFileName] = useState<string>("");
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function renderPdf(file: File) {
    setLoading(true);
    setError("");
    setPages([]);

    try {
      const pdfjs = await import("pdfjs-dist");
      configurePdfJsWorker(pdfjs);

      const buffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;

      const renderedPages: RenderedPage[] = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.3 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Could not get a canvas rendering context.");
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise;

        renderedPages.push({
          pageNumber,
          src: canvas.toDataURL("image/png"),
          width: canvas.width,
          height: canvas.height,
        });
      }

      setPages(renderedPages);
    } catch (err) {
      console.error("Failed to render PDF:", err);
      setError("Failed to render this PDF. Try another file.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Please upload a PDF file.");
      setFileName("");
      setPages([]);
      e.currentTarget.value = "";
      return;
    }

    setFileName(file.name);
    await renderPdf(file);
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">pdf-reading-test</h1>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <label htmlFor="pdf-upload" className="block text-sm font-medium text-gray-700">
            Upload a PDF
          </label>
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="mt-2 block w-full text-sm"
          />
          {fileName ? <p className="mt-2 text-sm text-gray-600">Loaded: {fileName}</p> : null}
          {loading ? <p className="mt-2 text-sm text-gray-600">Rendering PDF...</p> : null}
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>

        <section className="space-y-6" aria-live="polite">
          {pages.map((page) => (
            <article key={page.pageNumber} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <p className="mb-2 text-sm text-gray-500">Page {page.pageNumber}</p>
              <img
                src={page.src}
                alt={`Rendered PDF page ${page.pageNumber}`}
                width={page.width}
                height={page.height}
                className="h-auto max-w-full"
              />
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}