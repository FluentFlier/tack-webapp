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
