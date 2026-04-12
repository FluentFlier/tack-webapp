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
import { Settings } from "lucide-react";
import { getDocumentProxy, extractImages } from 'unpdf';
import type { TextItem, TextContent } from 'pdfjs-dist/types/src/display/api';



export default function Page() {
  const FULL_DOCUMENT_SUMMARY_MAX_CHARS = 1000;
  const FULL_DOCUMENT_SUMMARY_IDEAL_LENGTH = 300;


  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [readableHtml, setReadableHtml] = useState<React.ReactNode | null>(null);
  const [documentText, setDocumentText] = useState("");
  const [documentSummary, setDocumentSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryUsedTruncation, setSummaryUsedTruncation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const didShowRateLimitAlert = useRef(false);
  const didShowUnauthorizedAlert = useRef(false);

  function showRateLimitAlertOnce() {
    if (didShowRateLimitAlert.current) return;
    didShowRateLimitAlert.current = true;
    alert("Rate limit exceeded for AI features, please adjust your settings to increase the minimum size of a line/paragraph that is allowed to be summarized in order to reduce your AI usage and therefore avoid this error.");
  }

  function showUnauthorizedAlertOnce() {
    if (didShowUnauthorizedAlert.current) return;
    didShowUnauthorizedAlert.current = true;
    alert("You must be signed in to use AI summarization features.");
  }




  //USER SETTINGS

  const defaultSettings = {
    "AIDefaultShortening": false,
    "AIFullDocumentSummary": false,
    "displayPageNumbers": true,
    "backgroundColor": "#08080f",
    "middlegroundColor": "rgb(121, 121, 121)",
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

  //this function written by Copilot to generate document summaries using the first part of a document
  async function generateDocumentSummary(rawText: string, isCancelled: () => boolean = () => false) {
    if (!rawText.trim()) {
      setDocumentSummary(null);
      setSummaryError("No extracted document text available to summarize.");
      setSummaryLoading(false);
      setSummaryUsedTruncation(false);
      return;
    }

    const textForSummary = rawText.slice(0, FULL_DOCUMENT_SUMMARY_MAX_CHARS);
    const usedTruncation = rawText.length > FULL_DOCUMENT_SUMMARY_MAX_CHARS;

    if (!isCancelled() && mounted.current) {
      setSummaryLoading(true);
      setSummaryError(null);
      setSummaryUsedTruncation(usedTruncation);
    }

    try {
      const summary = await summarizeWithInsforge(
        textForSummary,
        FULL_DOCUMENT_SUMMARY_IDEAL_LENGTH,
        showRateLimitAlertOnce,
        showUnauthorizedAlertOnce
      );
      if (!isCancelled() && mounted.current) {
        setDocumentSummary(summary);
      }
    } catch (err: any) {
      if (!isCancelled() && mounted.current) {
        setDocumentSummary(null);
        setSummaryError(String(err.message ?? err));
      }
    } finally {
      if (!isCancelled() && mounted.current) {
        setSummaryLoading(false);
      }
    }
  }

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
    setDocumentText("");
    setDocumentSummary(null);
    setSummaryLoading(false);
    setSummaryError(null);
    setSummaryUsedTruncation(false);
    setError(null);
    didShowRateLimitAlert.current = false;
    didShowUnauthorizedAlert.current = false;
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
        console.log(await pdf.numPages);
        
        //load list of all pages
        let listOfPagePromises = [];
        for (let i = 1; i <= pdf.numPages; i++) {
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
                onRateLimit={showRateLimitAlertOnce}
                onUnauthorized={showUnauthorizedAlertOnce}
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


  const styleDictBackground = {
    backgroundColor: settings.backgroundColor
  }
  const styleDictMiddleground = {
    backgroundColor: settings.middlegroundColor,
  }
  const styleDictTextColor = {
    color: settings.textColor
  }

  return (
    <>
      <Header />
      <main style={styleDictBackground} className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto p-6 space-y-6">

          <div>
            <h1 style={styleDictTextColor} className="text-3xl font-bold">PDF Reading</h1>
            <Link style={styleDictTextColor} href="/pdf-reading-settings">
              <Button style={{...styleDictMiddleground, ...styleDictTextColor}} variant="ghost" size="sm" className="mt-2 gap-2 text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" aria-hidden="true" />
                PDF Reader Settings
              </Button>
            </Link>
          </div>

          <Card style={styleDictMiddleground}>
            <CardHeader>
              <CardTitle style={styleDictTextColor}>Upload PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="pdf-upload" style={styleDictTextColor}>Select a PDF file — the text content will appear below</Label>
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="mt-2 block text-sm text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
                style={{...styleDictTextColor, ...styleDictMiddleground}}
              />
              {fileName && (
                <p className="mt-2 text-sm text-muted-foreground" style={styleDictTextColor}>Selected: {fileName}</p>
              )}
            </CardContent>
          </Card>

          <Card style={styleDictMiddleground}>
            <CardHeader>
              <CardTitle style={styleDictTextColor}>Output</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && <p className="text-sm text-muted-foreground" style={styleDictTextColor}>Processing PDF...</p>}
              {error && <p className="text-sm text-destructive">Error: {error}</p>}
              {!loading && !error && readableHtml && (
                <div className="border border-border rounded-lg p-4 space-y-4" style={styleDictMiddleground}>
                  {settings.AIFullDocumentSummary && (
                    <>
                      <h3 className="text-md font-medium mb-1" style={styleDictTextColor}>Full document summary</h3>
                      {summaryLoading && (
                        <p className="text-sm text-muted-foreground" style={styleDictTextColor}>Generating summary...</p>
                      )}
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
                          Summary generated from the first {FULL_DOCUMENT_SUMMARY_MAX_CHARS.toLocaleString()} characters because this PDF is very long.
                        </p>
                      )}
                    </>
                  )}
                  <p className="text-sm text-muted-foreground" style={styleDictTextColor}>
                    Below is the content of the document. When you select a button labeled &quot;summarize line?&quot; you can press it to toggle an AI shortened version of the following line or paragraph. Pressing again returns the original.
                  </p>
                  <div>{readableHtml}</div>
                </div>
              )}
              {!loading && !error && !readableHtml && (
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
  onRateLimit?: () => void,
  onUnauthorized?: () => void
) {
  const res = await fetch("/api/insforge/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, targetLength }),
  });
  if (res.status === 429) {
    onRateLimit?.();
  }
  if (res.status === 401) {
    onUnauthorized?.();
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

