"use client"

//notes about this file
//The majority of this file was written using GPT-5 mini with edits from Daniel Briggs to fix functionality issues from the AI

import React, { useEffect, useRef, useState } from "react";
import { Header } from "@/components/layout";
import { Readability } from "@mozilla/readability";
import DOMPurify from "dompurify";




export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [readableHtml, setReadableHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      alert("Please upload a PDF file.");
      e.currentTarget.value = "";
      setFile(null);
      setFileName(null);
      return;
    }
    setFile(f);
    setFileName(f.name);
    setReadableHtml(null);
    setError(null);
  }

  useEffect(() => {
    if (!file) return;
    let cancelled = false;

    async function processPdf() {
      setLoading(true);
      setError(null);


      //import pdf.js //really not ideal not import here but doing it here to try to get the app working TODO: move this import to the top of the file and debug
      const pdfJS = await import("pdfjs-dist");

      try {
       
        
        if (file == null) throw new Error("No file to process");
        const arrayBuffer = await file.arrayBuffer();


        const loadingTask = pdfJS.getDocument({ data: arrayBuffer }); 
        const pdf = await loadingTask.promise;

        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          // Stop if unmounted or new file selected
          if (cancelled || !mounted.current) break;
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((it: any) => it.str).join(" ");
          fullText += pageText + "\n\n";
        }

        if (cancelled) return;

        // Build a minimal HTML document for Readability
        const bodyHtml = fullText
          .split(/\n\n+/)
          .map((p) => `<p>${escapeHtml(p)}</p>`)
          .join("\n");

        const docHtml = `<!doctype html><html><head><meta charset=\"utf-8\"></head><body><article>${bodyHtml}</article></body></html>`;

        // Sanitize before parsing into DOM
        const sanitized = DOMPurify.sanitize(docHtml);
        const parser = new DOMParser();
        const doc = parser.parseFromString(sanitized, "text/html");

        const reader = new Readability(doc);
        const article = reader.parse();
        const content = article?.content ?? `<p>No readable content could be extracted.</p>`;

        const final = DOMPurify.sanitize(content);
        if (!cancelled && mounted.current) setReadableHtml(final);
      } catch (err: any) {
        if (!cancelled && mounted.current) setError(String(err.message ?? err));
      } finally {
        if (!cancelled && mounted.current) setLoading(false);
      }
    }

    processPdf();

    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <>
      <Header />
      <main className="min-h-screen p-8">
        <h1 className="text-3xl text-gray-600">PDF Reading</h1>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">Upload PDF</label>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="mt-2"
          />
          {fileName && <p className="mt-2 text-sm text-gray-500">Selected: {fileName}</p>}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium mb-2">Preview</h2>
              <div>
                <h2 className="text-lg font-medium mb-2">Readability Output</h2>
                <div className="border rounded p-4 h-[600px] overflow-auto bg-white">
                  {loading && <p className="text-sm text-gray-500">Processing PDF...</p>}
                  {error && <p className="text-sm text-red-500">Error: {error}</p>}
                  {!loading && !error && readableHtml && (
                    <div dangerouslySetInnerHTML={{ __html: readableHtml }} />
                  )}
                  {!loading && !error && !readableHtml && (
                    <p className="text-sm text-gray-500">Upload a PDF to extract readable content.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
      </main>
    </>
  );
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
