"use client"

//notes about this file
//This file was written mostly by GPT-5 mini with some parts written by Daniel Briggs
//the full document summary function was implemented starting on 2026-4-3 using Github Copilot. Basically it takes the extracted lines of text, concatenates them together to get a list of all the text, truncates it if the text is too long, then runs that through the existing shorten function that shortens by a percentage using a calculated percentage to get to a roughly fixed length summary then outputs to html
//rate limiting and account needing to be signed in notifications were added using Copilot, basically when a rate limit error is encountered a function is the pdf-reader component is called (this makes sure an alert about the error is only shown once per page load, instead of once per error)
//some restyling was done using using AI by Jay to make the styling match the rest of the site

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout";
import PdfReadableLine from "@/components/pdf-reading/PdfReadableLine";
import PdfImageLine from "@/components/pdf-reading/PdfImageLine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Settings, X } from "lucide-react";
import { getDocumentProxy } from 'unpdf';
import type { TextItem, TextContent } from 'pdfjs-dist/types/src/display/api';
import { chunkTextForSummary } from "@/lib/chunk-text";
import { aiRequestQueue, RateLimitError, UnauthorizedError } from "@/lib/request-queue";



export default function Page() {
  // 18k gives headroom under the summarize route's Zod 20k text cap (not model context).
  const FULL_DOCUMENT_SUMMARY_MAX_CHARS = 18_000;
  const FULL_DOCUMENT_SUMMARY_IDEAL_LENGTH = 300;
  const CHUNK_SUMMARY_LENGTH = 600;


  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [readableHtml, setReadableHtml] = useState<React.ReactNode | null>(null);
  const [documentText, setDocumentText] = useState("");
  const [documentSummary, setDocumentSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryUsedTruncation, setSummaryUsedTruncation] = useState(false);
  const [summaryCoveragePercent, setSummaryCoveragePercent] = useState(100);
  const [summaryProgress, setSummaryProgress] = useState<{ current: number; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScannedPdf, setIsScannedPdf] = useState(false);
  const [aiNotice, setAiNotice] = useState<"rateLimit" | "unauthorized" | null>(null);
  const mounted = useRef(true);
  const didShowRateLimitNotice = useRef(false);
  const didShowUnauthorizedNotice = useRef(false);

  function showRateLimitNoticeOnce() {
    if (didShowRateLimitNotice.current) return;
    didShowRateLimitNotice.current = true;
    setAiNotice("rateLimit");
  }

  function showUnauthorizedNoticeOnce() {
    if (didShowUnauthorizedNotice.current) return;
    didShowUnauthorizedNotice.current = true;
    setAiNotice("unauthorized");
  }




  //USER SETTINGS

  const defaultSettings = {
    "AIDefaultShortening": false,
    "AIFullDocumentSummary": false,
    "displayPageNumbers": true,
    "backgroundColor": "#08080f",
    "middlegroundColor": "#0e0e15",
    "textColor": "#ffffff",
    "minLengthToSummarize": 200,
    "targetSummaryLength": 60, //percentage
  };

  type PDFReaderSettings = typeof defaultSettings;

  //this function written using Copilot inline suggestions then edited
  function getsettings() {

    try {
      const localStorageSettings = localStorage.getItem("pdfReaderSettings");
      if (localStorageSettings) {
        return JSON.parse(localStorageSettings) as PDFReaderSettings;
      }
      else {
        throw new Error("no settings in local storage")
      }
    }
    catch {
      return defaultSettings;
    }
  }

  let settings = getsettings()

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  //this function written by Copilot to generate document summaries using the full text of a document
  //map-reduce approach: split into ≤18000-char chunks, summarize each, then summarize the combined results
  async function generateDocumentSummary(rawText: string, isCancelled: () => boolean = () => false) {
    if (!rawText.trim()) {
      setDocumentSummary(null);
      setSummaryError("No extracted document text available to summarize.");
      setSummaryLoading(false);
      setSummaryUsedTruncation(false);
      return;
    }

    if (!isCancelled() && mounted.current) {
      setSummaryLoading(true);
      setSummaryError(null);
      setSummaryUsedTruncation(false);
      setSummaryProgress(null);
    }

    try {
      let summary: string;

      if (rawText.length <= FULL_DOCUMENT_SUMMARY_MAX_CHARS) {
        // Short document — single summarize call
        summary = await aiRequestQueue.enqueue(() =>
          summarizeWithInsforge(rawText, FULL_DOCUMENT_SUMMARY_IDEAL_LENGTH)
        );
      } else {
        // Long document — map-reduce
        const { chunks, truncated, coveragePercent } = chunkTextForSummary(
          rawText,
          FULL_DOCUMENT_SUMMARY_MAX_CHARS
        );

        if (!isCancelled() && mounted.current) {
          setSummaryUsedTruncation(truncated);
          setSummaryCoveragePercent(coveragePercent);
        }

        // Map phase: summarize each chunk
        const chunkSummaries: string[] = [];
        for (let i = 0; i < chunks.length; i++) {
          if (isCancelled() || !mounted.current) return;
          setSummaryProgress({ current: i + 1, total: chunks.length });
          const chunkSummary = await aiRequestQueue.enqueue(() =>
            summarizeWithInsforge(chunks[i], CHUNK_SUMMARY_LENGTH)
          );
          chunkSummaries.push(chunkSummary);
        }

        if (isCancelled() || !mounted.current) return;
        setSummaryProgress(null);

        // Reduce phase: concatenate chunk summaries and summarize once more
        let combined = chunkSummaries.join("\n\n");

        if (combined.length > FULL_DOCUMENT_SUMMARY_MAX_CHARS) {
          // Re-chunk the combined summaries if they are still very long
          const { chunks: reducedChunks } = chunkTextForSummary(
            combined,
            FULL_DOCUMENT_SUMMARY_MAX_CHARS
          );
          const reducedSummaries: string[] = [];
          for (let i = 0; i < reducedChunks.length; i++) {
            if (isCancelled() || !mounted.current) return;
            setSummaryProgress({ current: i + 1, total: reducedChunks.length });
            const s = await aiRequestQueue.enqueue(() =>
              summarizeWithInsforge(reducedChunks[i], CHUNK_SUMMARY_LENGTH)
            );
            reducedSummaries.push(s);
          }
          combined = reducedSummaries.join("\n\n");
        }

        if (isCancelled() || !mounted.current) return;
        setSummaryProgress(null);

        // Final summarize
        summary = await aiRequestQueue.enqueue(() =>
          summarizeWithInsforge(combined, FULL_DOCUMENT_SUMMARY_IDEAL_LENGTH)
        );
      }

      if (!isCancelled() && mounted.current) {
        setDocumentSummary(summary);
      }
    } catch (err: unknown) {
      if (!isCancelled() && mounted.current) {
        if (err instanceof RateLimitError) {
          showRateLimitNoticeOnce();
        } else if (err instanceof UnauthorizedError) {
          showUnauthorizedNoticeOnce();
        }
        setDocumentSummary(null);
        setSummaryError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (!isCancelled() && mounted.current) {
        setSummaryLoading(false);
        setSummaryProgress(null);
      }
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFileError("Please upload a PDF file.");
      e.currentTarget.value = "";
      setFile(null);
      setFileName(null);
      return;
    }
    setFileError(null);
    setFile(f);
    setFileName(f.name);
    setReadableHtml(null);
    setDocumentText("");
    setDocumentSummary(null);
    setSummaryLoading(false);
    setSummaryError(null);
    setSummaryUsedTruncation(false);
    setSummaryProgress(null);
    setIsScannedPdf(false);
    setAiNotice(null);
    setError(null);
    didShowRateLimitNotice.current = false;
    didShowUnauthorizedNotice.current = false;
  }

  useEffect(() => {
    if (!file) return;
    let cancelled = false;

    async function processPdf() {
      setLoading(true);
      setError(null);


      try {


        if (file == null) throw new Error("No file to process");
        const arrayBuffer = await file.arrayBuffer();




        const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
        const numPages = pdf.numPages;
        console.log(numPages);

        //load list of all pages
        let listOfPagePromises = [];
        for (let i = 1; i <= numPages; i++) {
          listOfPagePromises.push(pdf.getPage(i));
        }
        const pages = await Promise.all(listOfPagePromises);


        //for each page extract the textContent elements
        let textContents : TextItem[][] = [];

        for (let page of pages) {
          const textContent : TextContent = await page.getTextContent({includeMarkedContent: false}); //get the list of TextContent objects without any TextMarkedContentObjects
          let textContentItems = textContent.items as TextItem[];
          textContents.push(textContentItems); //store each page's text items in its own array
        }

        //collect page heights from PDF.js page viewports (scale 1)
        const pageHeights: number[] = pages.map((page) => page.getViewport({ scale: 1 }).height);

        //build a list containing all the text and images from the pdf with the relative text sizes
        type DocText = { type: 'text'; text: string; headingLevel: number; yPos: number };
        type DocImage = { type: 'image'; src: string; yPos: number };
        type DocElement = DocText | DocImage;

        let docElements: DocElement[] = [];

        //create a list of all the text heights in the document to sort by
        let heights : number[] = [];
        for (let pageItems of textContents) {
          for (let item of pageItems) {
            if (!heights.includes(item.height)) {
              heights.push(item.height);
            }
          }
        }
        heights.sort((a,b) => b-a); //sort heights from largest to smallest

        //The following conversion from heights to headings was generated by GPT-5 mini
        // Create a dictionary mapping each unique height to an estimated heading level (1..6)
        // Largest height -> 1 (h1), smallest -> 6 (h6). Heights in between are scaled.
        const heightToHeading: Record<number, number> = {};
        if (heights.length === 1) {
          heightToHeading[heights[0]] = 1;
        } else if (heights.length > 1) {
          const maxIndex = heights.length - 1;
          for (let i = 0; i < heights.length; i++) {
            const rank = i; // 0 = largest, maxIndex = smallest
            const level = Math.min(6, Math.max(1, Math.round((rank / maxIndex) * 5) + 1));
            heightToHeading[heights[i]] = level;
          }
        }


        let lastXIndent = -999;
        //populate docElements with text items (with position tracking)
        let tempDocText: { text: string; headingLevel: number; yPos: number }[] = [];
        let pageStartYPos = 0; //track the yPos of the start of each page

        for (let pageNum = 0; pageNum < textContents.length; pageNum++) {
          const pageItems = textContents[pageNum];
          const pageHeight = pageHeights[pageNum];

          //update pageStartYPos for the current page
          if (pageNum > 0) {
            pageStartYPos += pageHeights[pageNum - 1];
          }

          let lastLineWasPageNumber = false;
          for (let i = 0; i < pageItems.length; i++) {
            const item = pageItems[i] as TextItem;
            let lineText = item.str;


            //if the text is empty or only whitespace, skip it
            if (lineText.trim() === "") continue;


            //check whether this is a new page (first item of this page)
            let newPage = (i == 0);

            //check the heading level
            const headingLevel = heightToHeading[item.height] || 6; //default to 6 if height not recognized


            //if it's a new page then check whether this line or the last line is likely a page number and reformat it
            if (newPage) {

              //check whether the lineText is a arabic or roman numeral
              let pageNumberInDocument = Number(lineText.trim());
              if (isNaN(pageNumberInDocument)) {
                //try parsing as a roman numeral
                pageNumberInDocument = parseRomanNumeral(lineText.trim());
                if (isNaN(pageNumberInDocument)) {
                  //probably not a page num
                }
              }

              //if the lineText is likely a page number, reformat it to "Page X"
              if (!isNaN(pageNumberInDocument)) {
                lineText = "Page " + pageNumberInDocument;


                if (settings.displayPageNumbers) {
                  lastLineWasPageNumber = true //so that the next line gets set as a new paragraph
                  const adjustedYPos = calculateAdjustedYPos(pageHeight, item.transform[5], pageStartYPos)
                  tempDocText.push({"text": lineText, "headingLevel": headingLevel, "yPos": adjustedYPos});

                }
                continue; //skip the other parsing logic for this line
              }
            }

            //check whether this is the start of a new paragraph
            let isNewParagraph = false;
            if ((item.transform[4]-lastXIndent)/lastXIndent > .05) { //if the x position has increased significantly, assume it's a new paragraph
              isNewParagraph = true;
            }
            else {
              lastXIndent = item.transform[4]; //only update lastXIndent if we are not starting a new paragraph, to allow for multiple lines of the same paragraph to have slightly different indents without breaking the paragraph
            }


            //if the last line was displayed as a page number then treat this line as a new paragraph, and reset the state keeping track of whether the last line was a page number
            if (lastLineWasPageNumber) {
              isNewParagraph = true
              lastLineWasPageNumber = false
            }
            //if this is not a new paragraph and the height is the same as the previous item, assume it's a continuation of the same line and concatenate the text
            if (!isNewParagraph && i > 0 && headingLevel == tempDocText[tempDocText.length-1].headingLevel) {

              //if the last character of the last line is a "-" then remove it before combining (since a word was likely broken across two lines)
              let lastLine = tempDocText[tempDocText.length - 1].text;
              if (lastLine[lastLine.length-1] === "-") {
                lastLine = lastLine.slice(0, -1);
                tempDocText[tempDocText.length - 1].text = lastLine + lineText; //also combine the lines wihtout adding a space (in the middle of a word)
              }
              else {
                tempDocText[tempDocText.length - 1].text += " " + lineText;
              }

            }
            else {
              //otherwise add the text and the corresponding heading level to tempDocText with yPos
              const adjustedYPos = calculateAdjustedYPos(pageHeight, item.transform[5], pageStartYPos);
              tempDocText.push({"text": lineText, "headingLevel": headingLevel, "yPos": adjustedYPos});

            }
          }

          /*Disable image handling since it does not seem to work and only makes pdf parsing take longer at the moment
          //now try to extract images from this page
          try {
            const extractedImages = await extractImages(pdf, pageNum+1); //unPDF page numbers are 1-indexed
            console.log("Found " + extractedImages.length + " images on page " + (pageNum+1));

            for (const imgObj of extractedImages) {
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');

              if (!context) continue;

              canvas.width = imgObj.width;
              canvas.height = imgObj.height;

              //create ImageData from the extracted image data
              const imageData = context.createImageData(imgObj.width, imgObj.height);
              imageData.data.set(imgObj.data);

              //put the image data on the canvas
              context.putImageData(imageData, 0, 0);

              //convert canvas to data URL
              const imageDataUrl = canvas.toDataURL('image/png');

              //add the extracted image to docElements
              //use a large negative yPos to place it with the text from the same page
              docElements.push({
                type: 'image',
                src: imageDataUrl,
                yPos: pageStartYPos
              });
            }
          } catch (err) {
            console.warn(`Failed to extract images from page ${pageNum}:`, err);
          }
          */
        }

        //convert tempDocText to docElements
        for (let textItem of tempDocText) {
          docElements.push({
            type: 'text',
            text: textItem.text,
            headingLevel: textItem.headingLevel,
            yPos: textItem.yPos
          });
        }

        console.log(docElements);

  const fullDocumentText = tempDocText.map((item) => item.text).join("\n\n");




        if (cancelled) return;

        // Detect scanned/image-only PDFs (no extractable text layer)
        if (fullDocumentText.trim().length < 50 && numPages >= 1) {
          if (!cancelled && mounted.current) {
            setIsScannedPdf(true);
            setReadableHtml(null);
            setDocumentText("");
          }
          return;
        }
        setIsScannedPdf(false);

        //sort docElements by yPos (in accending order, then by type to keep images together)
        docElements.sort((a, b) => {
          if (a.yPos !== b.yPos) return a.yPos - b.yPos;
          return a.type === 'image' ? 1 : -1;
        });

        const elements = docElements.map((element, idx) => {
          if (element.type === 'text') {
            return (
              <PdfReadableLine
                key={idx}
                headingLevel={element.headingLevel}
                content={element.text}
                defaultToSummary={settings.AIDefaultShortening}
                textColor={settings.textColor}
                minLengthToSummarize={settings.minLengthToSummarize}
                summarizePercent={settings.targetSummaryLength}
                onRateLimit={showRateLimitNoticeOnce}
                onUnauthorized={showUnauthorizedNoticeOnce}
              />
            );
          } else {
            return (
              <PdfImageLine
                key={idx}
                src={element.src}
              />
            );
          }
        });

        if (!cancelled && mounted.current) {
          setReadableHtml(elements);
          setDocumentText(fullDocumentText);

          if (settings.AIFullDocumentSummary) {
            void generateDocumentSummary(fullDocumentText, () => cancelled);
          }
        }
      } catch (err: unknown) {
        if (!cancelled && mounted.current) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled && mounted.current) setLoading(false);
      }
    }

    processPdf();

    return () => {
      cancelled = true;
    };
  }, [file]);


  const styleDictBackground = {
    backgroundColor: settings.backgroundColor
  }
  const styleDictMiddleground = {
    backgroundColor: settings.middlegroundColor,
  }
  const styleDictTextColor = {
    color: settings.textColor
  }

  const aiNoticeMessage =
    aiNotice === "rateLimit"
      ? "AI request limit reached. Summarization is paused briefly — it will resume automatically. You can raise the minimum paragraph length in PDF Reader Settings to reduce AI usage."
      : aiNotice === "unauthorized"
      ? "Sign in to use AI summarization features."
      : null;

  return (
    <>
      <Header />
      <main style={styleDictBackground} className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">

          <div>
            <p
              aria-hidden="true"
              style={styleDictTextColor}
              className="font-mono text-[0.66rem] uppercase tracking-[0.2em] opacity-60 mb-2"
            >
              Document Access
            </p>
            <h1 style={styleDictTextColor} className="font-serif text-4xl font-medium tracking-tight">PDF Reading</h1>
            <Link style={styleDictTextColor} href="/pdf-reading-settings">
              <Button style={{...styleDictMiddleground, ...styleDictTextColor}} variant="ghost" size="sm" className="mt-3 gap-2 rounded-lg border border-[rgba(99,102,241,0.3)] text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" aria-hidden="true" />
                PDF Reader Settings
              </Button>
            </Link>
          </div>

          <div
            role="alert"
            style={{ ...styleDictTextColor, borderColor: "rgba(255, 180, 90, 0.45)" }}
            className="mb-4 rounded-lg border-l-4 bg-amber-500/10 p-4 text-sm leading-relaxed"
          >
            <p className="font-semibold mb-1">Before uploading, please read:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The PDF Reader may upload your document to third-party AI providers to enable summarization features (which may be on by default).</li>
              <li>AI output may misrepresent or invent information. Do not blindly trust it.</li>
            </ul>
          </div>

          <Card style={styleDictMiddleground} className="rounded-[14px] border-[rgba(99,102,241,0.3)]">
            <CardHeader>
              <CardTitle style={styleDictTextColor} className="font-serif text-lg font-medium tracking-normal">Upload PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="pdf-upload" style={styleDictTextColor}>Select a PDF file — the text content will appear below.</Label>
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="mt-2 block text-sm text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
                style={{...styleDictTextColor, ...styleDictMiddleground}}
              />
              {fileError && (
                <p role="alert" className="mt-2 text-sm text-destructive">{fileError}</p>
              )}
              {fileName && (
                <p className="mt-2 text-sm text-muted-foreground" style={styleDictTextColor}>Selected: {fileName}</p>
              )}
            </CardContent>
          </Card>

          <Card style={styleDictMiddleground} className="rounded-[14px] border-[rgba(99,102,241,0.3)]">
            <CardHeader>
              <CardTitle style={styleDictTextColor} className="font-serif text-lg font-medium tracking-normal">Output</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Inline AI error notice — replaces blocking alert() */}
              {aiNotice && aiNoticeMessage && (
                <div
                  role="alert"
                  style={{ borderColor: "rgba(255, 120, 90, 0.55)", ...styleDictTextColor }}
                  className="mb-4 flex items-start gap-3 rounded-md border-l-4 bg-red-500/10 p-4 text-sm"
                >
                  <p className="flex-1">{aiNoticeMessage}</p>
                  <button
                    type="button"
                    aria-label="Dismiss notice"
                    onClick={() => setAiNotice(null)}
                    className="shrink-0 rounded p-0.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-current"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}

              {loading && <p className="text-sm text-muted-foreground" style={styleDictTextColor}>Processing PDF...</p>}
              {error && <p className="text-sm text-destructive">Error: {error}</p>}

              {/* Scanned PDF detection notice */}
              {!loading && !error && isScannedPdf && (
                <div
                  role="alert"
                  style={{ borderColor: "rgba(255, 180, 90, 0.45)", ...styleDictTextColor }}
                  className="rounded-md border-l-4 bg-amber-500/10 p-4 text-sm"
                >
                  This PDF appears to contain scanned images without a text layer. Text extraction is not possible for this document yet.
                </div>
              )}

              {!loading && !error && readableHtml && (
                <div className="border border-[rgba(99,102,241,0.28)] rounded-lg p-5 space-y-4" style={styleDictMiddleground}>
                  {settings.AIFullDocumentSummary && (
                    <>
                      <h3 className="text-md font-medium mb-1" style={styleDictTextColor}>Full document summary</h3>
                      {/* Always mounted so screen readers catch the first announcement. */}
                      <p
                        role="status"
                        className="text-sm text-muted-foreground"
                        style={styleDictTextColor}
                      >
                        {summaryProgress
                          ? `Summarizing part ${summaryProgress.current} of ${summaryProgress.total}…`
                          : summaryLoading
                          ? "Generating summary..."
                          : ""}
                      </p>
                      {summaryError && (
                        <div className="flex flex-col gap-2">
                          <p className="text-sm text-destructive" style={styleDictTextColor}>Error: {summaryError}</p>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-fit"
                            onClick={() => void generateDocumentSummary(documentText)}
                            disabled={!documentText || summaryLoading}
                            style={styleDictTextColor}
                          >
                            Retry summary
                          </Button>
                        </div>
                      )}
                      {!summaryLoading && !summaryError && documentSummary && (
                        <p className="text-sm">{documentSummary}</p>
                      )}
                      {!summaryLoading && !summaryError && !documentSummary && (
                        <p className="text-sm text-muted-foreground" style={styleDictTextColor}>A summary will appear here after processing.</p>
                      )}
                      {summaryUsedTruncation && (
                        <p className="text-xs text-muted-foreground mt-2" style={styleDictTextColor}>
                          Summary covers approximately the first {summaryCoveragePercent}% of the document because it exceeds the maximum supported length.
                        </p>
                      )}
                    </>
                  )}
                  <p className="text-sm text-muted-foreground" style={styleDictTextColor}>
                    Below is the content of the document. For each long paragraph you will see a &quot;Show summary&quot; button — press it to toggle an AI-shortened version of that paragraph. Press &quot;Show original&quot; to return to the full text.
                  </p>
                  <div>{readableHtml}</div>
                </div>
              )}
              {!loading && !error && !readableHtml && !isScannedPdf && (
                <p className="text-sm text-muted-foreground" style={styleDictTextColor}>
                  Once you upload a PDF above, the text content of the document will appear here.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}


//this function written with Copilot to utilize the shorten api route
// Client helper: shorten a paragraph by a given percent using the InsForge model gateway
// `percent` is the percentage to shorten by (e.g. 30 means reduce length by 30%)
export async function shortenWithInsforge(text: string, percent: number) {
  const res = await fetch("/api/insforge/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, percent }),
  });
  if (res.status === 429) {
    throw new RateLimitError();
  }
  if (res.status === 401) {
    throw new UnauthorizedError();
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "Request failed");
  }
  const json = await res.json();
  return json.shortened as string;
}

//this function copied from shortenWithInsforge then modified for the full document summaries
export async function summarizeWithInsforge(
  text: string,
  targetLength: number,
) {
  const res = await fetch("/api/insforge/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, targetLength }),
  });
  if (res.status === 429) {
    throw new RateLimitError();
  }
  if (res.status === 401) {
    throw new UnauthorizedError();
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "Request failed");
  }
  const json = await res.json();
  return json.summary as string;
}

//This function was written by GPT-5 mini
// Accepts values up to 3999 (standard Roman numeral form).
export function parseRomanNumeral(input: string): number {
  if (typeof input !== "string") return NaN;
  const s = input.trim().toUpperCase();
  if (s.length === 0) return NaN;

  // Strict validation for standard Roman numerals (0-3999)
  const valid = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
  if (!valid.test(s)) return NaN;

  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const value = map[s[i]];
    const next = map[s[i + 1]] ?? 0;
    if (value < next) total -= value;
    else total += value;
  }
  return total;
}

//when repeatedly caled with the y information extracted from a pdf about the location of text elements this function will adjust the y values so they are always increasing when an element is lower in a document.
function calculateAdjustedYPos(pageHeight: number, originalYTransform: number, pageStartYPos: number) {

  return (pageHeight - originalYTransform) + pageStartYPos;
}
