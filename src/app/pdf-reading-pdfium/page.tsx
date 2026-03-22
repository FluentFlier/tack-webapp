"use client";

import React, { useState } from "react";
import { PDFViewer } from "@/components/pdf-reading/PdfViewer";


export default function PdfReadingTestPage() {
  const [fileName, setFileName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [activeUrl, setActiveUrl] = useState("");
  const [error, setError] = useState<string>("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Please upload a PDF file.");
      setFileName("");
      setSelectedFile(null);
      e.currentTarget.value = "";
      return;
    }

    setError("");
    setFileName(file.name);
    setSelectedFile(file);
    setActiveUrl("");
  }

  function handleUseUrl() {
    const normalized = urlInput.trim();
    if (!normalized) {
      setError("Please enter a PDF URL.");
      return;
    }

    setError("");
    setActiveUrl(normalized);
    setSelectedFile(null);
    setFileName("");
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">pdf-reading-pdfium</h1>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <label htmlFor="pdf-url" className="block text-sm font-medium text-gray-700">
            PDF URL
          </label>
          <div className="mt-2 flex flex-col gap-2 md:flex-row">
            <input
              id="pdf-url"
              type="url"
              placeholder="https://example.com/sample.pdf"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleUseUrl}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Load URL
            </button>
          </div>

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
          {activeUrl ? <p className="mt-2 text-sm text-gray-600">Loaded URL: {activeUrl}</p> : null}
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>

        <section className="space-y-6" aria-live="polite">
          {(selectedFile || activeUrl) ? (
            <PDFViewer file={selectedFile ?? undefined} url={selectedFile ? undefined : activeUrl} height={700} />
          ) : (
            <p className="text-sm text-gray-600">Select a PDF file or enter a URL to preview.</p>
          )}
        </section>
      </div>
    </main>
  );
}