"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveRegion } from "@/components/a11y";
import { Upload, FileText, Sparkles, Loader2 } from "lucide-react";
import type { PDFContent } from "@/types";

type ViewMode = "upload" | "reading" | "summary";

export default function PDFPage() {
  const [pdfContent, setPdfContent] = useState<PDFContent | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("upload");
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setLoading(true);
    setStatusMessage("Processing PDF...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to process PDF");
      }

      const data: PDFContent = await response.json();
      setPdfContent(data);
      setViewMode("reading");
      setStatusMessage(`Loaded: ${data.title || file.name}, ${data.numPages} pages`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process PDF");
      setStatusMessage("Error processing PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!pdfContent) return;
    setSummarizing(true);
    setStatusMessage("Generating AI summary...");

    try {
      const response = await fetch("/api/pdf/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: pdfContent.simplified,
          title: pdfContent.title,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to summarize");
      }

      const data = await response.json();
      setSummary(data.summary);
      setViewMode("summary");
      setStatusMessage("Summary generated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to summarize");
    } finally {
      setSummarizing(false);
    }
  };

  const handleReset = () => {
    setPdfContent(null);
    setSummary(null);
    setViewMode("upload");
    setError(null);
    setStatusMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <LiveRegion message={statusMessage} />

      <div>
        <h1 className="text-2xl font-bold">PDF Reader</h1>
        <p className="text-muted-foreground mt-1">
          Upload a PDF to read in a simplified, accessible format
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </p>
      )}

      {viewMode === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <label
              htmlFor="pdf-upload"
              className="flex flex-col items-center gap-3 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary focus-within:ring-2 focus-within:ring-ring transition-colors"
            >
              <Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">
                {loading ? "Processing..." : "Click to select a PDF file (max 20MB)"}
              </span>
              <input
                ref={fileInputRef}
                id="pdf-upload"
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
                disabled={loading}
              />
            </label>
          </CardContent>
        </Card>
      )}

      {viewMode !== "upload" && pdfContent && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
              New PDF
            </Button>
            <Button
              variant={viewMode === "reading" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("reading")}
            >
              <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
              Simplified Text
            </Button>
            <Button
              variant={viewMode === "summary" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (summary) {
                  setViewMode("summary");
                } else {
                  handleSummarize();
                }
              }}
              disabled={summarizing}
            >
              {summarizing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
              )}
              {summarizing ? "Summarizing..." : "AI Summary"}
            </Button>
          </div>

          <article aria-label={pdfContent.title || "PDF Document"}>
            <header className="space-y-1 mb-4">
              <h2 className="text-xl font-semibold">{pdfContent.title}</h2>
              {pdfContent.author && (
                <p className="text-sm text-muted-foreground">By {pdfContent.author}</p>
              )}
              <p className="text-sm text-muted-foreground">{pdfContent.numPages} pages</p>
            </header>

            <div className="prose prose-lg max-w-none dark:prose-invert leading-relaxed">
              {viewMode === "reading" &&
                pdfContent.simplified.split("\n\n").map((paragraph, i) =>
                  paragraph.trim() ? (
                    <p key={i} className="mb-4">{paragraph.trim()}</p>
                  ) : null
                )}
              {viewMode === "summary" && summary &&
                summary.split("\n\n").map((paragraph, i) =>
                  paragraph.trim() ? (
                    <p key={i} className="mb-4 whitespace-pre-wrap">{paragraph.trim()}</p>
                  ) : null
                )}
            </div>
          </article>
        </>
      )}
    </div>
  );
}
