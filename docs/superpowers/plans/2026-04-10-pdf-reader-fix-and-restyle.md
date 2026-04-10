# PDF Reader Fix & UI Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the infinite re-render loop causing the PDF output to flash, and restyle the PDF reader and settings pages to match the app's dark cinematic design system.

**Architecture:** A `useMemo` fix stabilizes the `settings` reference so the PDF processing effect no longer fires on every render. UI changes remove all hardcoded inline color styles and replace them with design system components (`Card`, `Label`, `Button`) and Tailwind CSS variables (`bg-background`, `text-foreground`, etc.) matching the rest of the app. The `textColor` prop is removed from `PdfReadableLine` since custom colors are no longer supported.

**Tech Stack:** Next.js 15, React, Tailwind CSS, shadcn/ui (`Card`, `Label`, `Button`), Lucide icons

---

## File Map

| File | Change |
|------|--------|
| `src/components/pdf-reading/pdf-reader.tsx` | Fix `useMemo`, remove inline styles, add imports, restyle layout |
| `src/components/pdf-reading/PdfReadableLine.tsx` | Remove `textColor` prop and inline `style` usages |
| `src/components/pdf-reading/pdf-reader-settings.tsx` | Remove inline styles + color settings, add imports, restyle layout |

---

## Task 1: Fix the infinite re-render loop

**Files:**
- Modify: `src/components/pdf-reading/pdf-reader.tsx`

- [ ] **Step 1: Add `useMemo` to the React import**

In `src/components/pdf-reading/pdf-reader.tsx`, change line 9:

```tsx
import React, { useEffect, useRef, useState } from "react";
```
to:
```tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
```

- [ ] **Step 2: Stabilize the `settings` reference**

Change line 84:
```tsx
let settings = getsettings()
```
to:
```tsx
const settings = useMemo(() => getsettings(), []);
```

- [ ] **Step 3: Verify the fix works**

Run the dev server (`npm run dev`) and navigate to `/pdf-reading`. Upload any PDF. Confirm the output renders once and stops — no more flashing.

- [ ] **Step 4: Commit**

```bash
git add src/components/pdf-reading/pdf-reader.tsx
git commit -m "fix: stabilize settings reference to stop PDF re-render loop"
```

---

## Task 2: Remove `textColor` prop from PdfReadableLine

**Files:**
- Modify: `src/components/pdf-reading/PdfReadableLine.tsx`

- [ ] **Step 1: Remove `textColor` from the Props type and function signature**

In `src/components/pdf-reading/PdfReadableLine.tsx`, replace the Props type and function signature:

```tsx
type Props = {
    headingLevel: number;
    content: string;
    onOpen?: (content: string) => void;
    onRateLimit?: () => void;
    onUnauthorized?: () => void;
    summarizePercent?: number;
    defaultToSummary: boolean;
    minLengthToSummarize: number;
};

export const PdfReadableLine: React.FC<Props> = ({ headingLevel, content, onOpen, onRateLimit, onUnauthorized, summarizePercent = 50, defaultToSummary = false, minLengthToSummarize = 1000}) => {
```

- [ ] **Step 2: Remove `pstyleDict` and inline styles**

Remove these lines entirely:
```tsx
    const pstyleDict = {
        "color": textColor
    }
```

Change the summarize button (near the bottom of the component) from:
```tsx
    let summarizeButton = <button style={pstyleDict} onClick={doToggle}>summarize line? {`${isSummary ? "enabled" : "disabled"}`}</button>;
```
to:
```tsx
    let summarizeButton = <button className="text-xs text-muted-foreground underline mb-1" onClick={doToggle}>summarize line? {`${isSummary ? "enabled" : "disabled"}`}</button>;
```

Change the `<p>` tag from:
```tsx
        <p className={`${baseClass} transition-transform transition-opacity duration-200 ${summaryStyle} ${fadeClass}`} style={pstyleDict}>
```
to:
```tsx
        <p className={`${baseClass} transition-transform transition-opacity duration-200 ${summaryStyle} ${fadeClass}`}>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pdf-reading/PdfReadableLine.tsx
git commit -m "refactor: remove textColor prop from PdfReadableLine, use CSS variables"
```

---

## Task 3: Restyle pdf-reader.tsx — imports and cleanup

**Files:**
- Modify: `src/components/pdf-reading/pdf-reader.tsx`

- [ ] **Step 1: Update imports**

Replace the existing import block at the top of `src/components/pdf-reading/pdf-reader.tsx` (lines 9–16):

```tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout";
import PdfReadableLine from "@/components/pdf-reading/PdfReadableLine";
import PdfImageLine from "@/components/pdf-reading/PdfImageLine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { getDocumentProxy, extractImages } from 'unpdf';
import type { TextItem, TextContent } from 'pdfjs-dist/types/src/display/api';
```

- [ ] **Step 2: Remove inline style dictionaries and unused settings keys**

Remove the `styleDictBackground` and `styleDictTextColor` objects (around lines 442–447):
```tsx
  const styleDictBackground = {
    backgroundColor: settings.backgroundColor
  }
  const styleDictTextColor = {
    color: settings.textColor
  }
```

Remove `"backgroundColor"` and `"textColor"` from `defaultSettings` (lines 56–63). The updated `defaultSettings` should be:
```tsx
  const defaultSettings = {
    "AIDefaultShortening": false,
    "AIFullDocumentSummary": false,
    "displayPageNumbers": true,
    "minLengthToSummarize": 200,
    "targetSummaryLength": 60,
  };
```

- [ ] **Step 3: Remove `textColor` from the PdfReadableLine usage**

Find the `<PdfReadableLine` usage inside `processPdf` (around line 397) and remove the `textColor` prop:
```tsx
              <PdfReadableLine 
                key={idx} 
                headingLevel={element.headingLevel} 
                content={element.text} 
                defaultToSummary={settings.AIDefaultShortening}
                minLengthToSummarize={settings.minLengthToSummarize}
                summarizePercent={settings.targetSummaryLength}
                onRateLimit={showRateLimitAlertOnce}
                onUnauthorized={showUnauthorizedAlertOnce}
              />
```

- [ ] **Step 4: Commit**

```bash
git add src/components/pdf-reading/pdf-reader.tsx
git commit -m "refactor: update pdf-reader imports, remove inline style dicts and color settings"
```

---

## Task 4: Restyle pdf-reader.tsx — JSX layout

**Files:**
- Modify: `src/components/pdf-reading/pdf-reader.tsx`

- [ ] **Step 1: Replace the entire return block**

Replace the `return (...)` at the bottom of the component (lines 451–522) with:

```tsx
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto p-6 space-y-6">

          <div>
            <h1 className="text-3xl font-bold">PDF Reading</h1>
            <Link href="/pdf-reading-settings">
              <Button variant="ghost" size="sm" className="mt-2 gap-2 text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" aria-hidden="true" />
                PDF Reader Settings
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="pdf-upload">Select a PDF file — the text content will appear below</Label>
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="mt-2 block text-sm text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
              />
              {fileName && (
                <p className="mt-2 text-sm text-muted-foreground">Selected: {fileName}</p>
              )}
            </CardContent>
          </Card>

          <div>
            <h2 className="text-lg font-medium mb-3">Output</h2>
            {loading && <p className="text-sm text-muted-foreground">Processing PDF...</p>}
            {error && <p className="text-sm text-destructive">Error: {error}</p>}
            {!loading && !error && readableHtml && (
              <div className="border border-border rounded-lg p-4 space-y-4">
                {settings.AIFullDocumentSummary && (
                  <div className="rounded-lg border border-border bg-muted p-3">
                    <h3 className="text-md font-medium mb-1">Full document summary</h3>
                    {summaryLoading && (
                      <p className="text-sm text-muted-foreground">Generating summary...</p>
                    )}
                    {summaryError && (
                      <div className="flex flex-col gap-2">
                        <p className="text-sm text-destructive">Error: {summaryError}</p>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-fit"
                          onClick={() => void generateDocumentSummary(documentText)}
                          disabled={!documentText || summaryLoading}
                        >
                          Retry summary
                        </Button>
                      </div>
                    )}
                    {!summaryLoading && !summaryError && documentSummary && (
                      <p className="text-sm">{documentSummary}</p>
                    )}
                    {!summaryLoading && !summaryError && !documentSummary && (
                      <p className="text-sm text-muted-foreground">A summary will appear here after processing.</p>
                    )}
                    {summaryUsedTruncation && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Summary generated from the first {FULL_DOCUMENT_SUMMARY_MAX_CHARS.toLocaleString()} characters because this PDF is very long.
                      </p>
                    )}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Below is the content of the document. When you select a button labeled &quot;summarize line?&quot; you can press it to toggle an AI shortened version of the following line or paragraph. Pressing again returns the original.
                </p>
                <div>{readableHtml}</div>
              </div>
            )}
            {!loading && !error && !readableHtml && (
              <p className="text-sm text-muted-foreground">
                Once you upload a PDF above, the text content of the document will appear here.
              </p>
            )}
          </div>

        </div>
      </main>
    </>
  );
```

- [ ] **Step 2: Verify in browser**

Run `npm run dev`, navigate to `/pdf-reading`. Confirm:
- Page has dark background matching the rest of the site
- Upload card is visible with styled file input
- Upload a PDF — output renders without flashing

- [ ] **Step 3: Commit**

```bash
git add src/components/pdf-reading/pdf-reader.tsx
git commit -m "style: restyle PDF reader page to match app dark theme"
```

---

## Task 5: Restyle pdf-reader-settings.tsx

**Files:**
- Modify: `src/components/pdf-reading/pdf-reader-settings.tsx`

- [ ] **Step 1: Replace the entire file contents**

Replace `src/components/pdf-reading/pdf-reader-settings.tsx` with:

```tsx
"use client"

import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function Page() {
  const defaultSettings = {
    "AIDefaultShortening": false,
    "AIFullDocumentSummary": false,
    "displayPageNumbers": true,
    "minLengthToSummarize": 200,
    "targetSummaryLength": 60,
  };

  type PDFReaderSettings = typeof defaultSettings;

  function getsettings() {
    try {
      const localStorageSettings = localStorage.getItem("pdfReaderSettings");
      if (localStorageSettings) {
        return JSON.parse(localStorageSettings) as PDFReaderSettings;
      } else {
        throw new Error("no settings in local storage");
      }
    } catch {
      return defaultSettings;
    }
  }

  let settings = getsettings();

  function saveSettings() {
    saveSettingsLocalStorage(settings);
  }

  function saveSettingsLocalStorage(updatedSettings: typeof settings) {
    localStorage.setItem("pdfReaderSettings", JSON.stringify(updatedSettings));
  }

  function toggleAIDefaultShortening() {
    settings.AIDefaultShortening = !settings.AIDefaultShortening;
    document.getElementById("toggleAIDefaultShorteningStatusSpan")!.textContent = getAIDefaultShorteningStatus();
    saveSettings();
  }

  function toggleAIFullDocumentSummary() {
    settings.AIFullDocumentSummary = !settings.AIFullDocumentSummary;
    document.getElementById("toggleAIFullDocumentSummaryStatusSpan")!.textContent = getAIFullDocumentSummaryStatus();
    saveSettings();
  }

  function togglePageNumbers() {
    settings.displayPageNumbers = !settings.displayPageNumbers;
    document.getElementById("togglePageNumbersStatusSpan")!.textContent = getPageNumbersStatus();
    saveSettings();
  }

  function updateMinLengthToSummarize(event: React.ChangeEvent<HTMLInputElement>) {
    settings.minLengthToSummarize = Number(event.target.value);
    saveSettings();
  }

  function updateTargetSummaryLength(event: React.ChangeEvent<HTMLInputElement>) {
    settings.targetSummaryLength = Number(event.target.value);
    saveSettings();
  }

  function getAIDefaultShorteningStatus() {
    return settings.AIDefaultShortening ? "Enabled" : "Disabled";
  }
  function getAIFullDocumentSummaryStatus() {
    return settings.AIFullDocumentSummary ? "Enabled" : "Disabled";
  }
  function getPageNumbersStatus() {
    return settings.displayPageNumbers ? "Enabled" : "Disabled";
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto p-6 space-y-6">

          <div>
            <h1 className="text-3xl font-bold">PDF Reader Settings</h1>
            <Link href="/pdf-reading">
              <Button variant="ghost" size="sm" className="mt-2 gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to PDF Reading
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">AI shorten paragraphs by default</span>
                <Button variant="outline" size="sm" onClick={toggleAIDefaultShortening}>
                  <span id="toggleAIDefaultShorteningStatusSpan">{getAIDefaultShorteningStatus()}</span>
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">AI full document summary</span>
                <Button variant="outline" size="sm" onClick={toggleAIFullDocumentSummary}>
                  <span id="toggleAIFullDocumentSummaryStatusSpan">{getAIFullDocumentSummaryStatus()}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Display</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Display page numbers</span>
                <Button variant="outline" size="sm" onClick={togglePageNumbers}>
                  <span id="togglePageNumbersStatusSpan">{getPageNumbersStatus()}</span>
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minLengthToSummarizePicker">
                  Minimum paragraph length to show summarize button (characters)
                </Label>
                <input
                  type="number"
                  min="50"
                  max="1000"
                  step="25"
                  id="minLengthToSummarizePicker"
                  onChange={updateMinLengthToSummarize}
                  defaultValue={settings.minLengthToSummarize}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetSummaryLengthPicker">
                  Target summary length (% of original)
                </Label>
                <input
                  type="number"
                  min="20"
                  max="99"
                  step="2"
                  id="targetSummaryLengthPicker"
                  onChange={updateTargetSummaryLength}
                  defaultValue={settings.targetSummaryLength}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/pdf-reading-settings`. Confirm:
- Page has dark background matching the rest of the site
- Cards group AI Features and Display settings
- Toggle buttons show "Enabled"/"Disabled" and update on click
- Number inputs are styled consistently
- "Back to PDF Reading" link navigates correctly

- [ ] **Step 3: Commit**

```bash
git add src/components/pdf-reading/pdf-reader-settings.tsx
git commit -m "style: restyle PDF reader settings page to match app dark theme"
```
