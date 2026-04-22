"use client"

//this file written originally by Daniel Briggs then debugged and fixed using Copilot
//AI was also used to restyle it to match the styling of the rest of the site, Copilot inline suggestions then used to help in manually undoing some changes that removed the text and background color settings

import React, { useEffect, useState } from "react";
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
    "backgroundColor": "#08080f",
    "middlegroundColor": "#0e0e15", "textColor": "#ffffff",
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
     //eventually save settings to Insforge backend, at the moment this is just a stub
  }

  function saveSettingsLocalStorage(updatedSettings: typeof settings) {
    localStorage.setItem("pdfReaderSettings", JSON.stringify(updatedSettings));
  }

  //Copilot inline suggestions used to add the ! non null operator and the .textContent to these functoins
  function toggleAIDefaultShortening() {
    settings.AIDefaultShortening = !settings.AIDefaultShortening

    let statusSpan = document.getElementById("toggleAIDefaultShorteningStatusSpan");
    statusSpan!.textContent = getAIDefaultShorteningStatus();
    //statusSpan!.focus(); this doesn't seem to do anything
    
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

  //Copilot was used to convert document.getElementByID("<ID>").value to the react event format below
  function updateMinLengthToSummarize(event: React.ChangeEvent<HTMLInputElement>) {
    settings.minLengthToSummarize = Number(event.target.value);
    saveSettings();
  }

  function updateTargetSummaryLength(event: React.ChangeEvent<HTMLInputElement>) {
    settings.targetSummaryLength = Number(event.target.value);
    saveSettings();
  }
  function updateBackgroundColorSetting(event: React.ChangeEvent<HTMLInputElement>) {
    settings.backgroundColor =  event.target.value;

    saveSettings();
  }
  function updateMiddlegroundColorSetting(event: React.ChangeEvent<HTMLInputElement>) {
    settings.middlegroundColor = event.target.value;
    saveSettings();
  }

  function updateTextColorSetting(event: React.ChangeEvent<HTMLInputElement>) {
    settings.textColor = event.target.value;
    saveSettings();
  }


  const styleBackgroundColorDict = {
    backgroundColor: settings.backgroundColor,
  }
  const styleMiddlegroundColorDict = {
    backgroundColor: settings.middlegroundColor,
  }
  const styleTextColorDict = {
    color: settings.textColor,
  }

  function getAIDefaultShorteningStatus() {
    return settings.AIDefaultShortening ? "enabled" : "disabled";
  }
  function getAIFullDocumentSummaryStatus() {
    return settings.AIFullDocumentSummary ? "enabled" : "disabled";
  }
  function getPageNumbersStatus() {
    return settings.displayPageNumbers ? "enabled" : "disabled";
  }

  

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background" style={styleBackgroundColorDict}>
        <div className="max-w-2xl mx-auto p-6 space-y-6">

          <div>
            <h1 className="text-3xl font-bold" style={styleTextColorDict}>PDF Reader Settings</h1>
            <Link href="/pdf-reading">
              <Button style={{...styleMiddlegroundColorDict, ...styleTextColorDict}} variant="ghost" size="sm" className="mt-2 gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to PDF Reading
              </Button>
            </Link>
            <h4 className="font-bold" style={styleTextColorDict}>Note: These settings only apply to the PDF reader and will not be saved to your account. For now they are only saved in your browser</h4>
          </div>

          <Card style={styleMiddlegroundColorDict}>
            <CardHeader style={styleTextColorDict}>
              <CardTitle>AI Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" style={styleMiddlegroundColorDict}>
              <div className="flex items-center justify-between">
                <span style={styleTextColorDict} className="text-sm">AI shorten paragraphs by default</span>
                <Button style={styleBackgroundColorDict} variant="outline" size="sm" onClick={toggleAIDefaultShortening}>
                  <span style={styleTextColorDict} id="toggleAIDefaultShorteningStatusSpan">{getAIDefaultShorteningStatus()}</span>
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span style={styleTextColorDict} className="text-sm">AI full document summary</span>
                <Button style={styleBackgroundColorDict} variant="outline" size="sm" onClick={toggleAIFullDocumentSummary}>
                  <span style={styleTextColorDict} id="toggleAIFullDocumentSummaryStatusSpan">{getAIFullDocumentSummaryStatus()}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card style={styleMiddlegroundColorDict}>
            <CardHeader style={styleTextColorDict}>
              <CardTitle>Display</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span style={styleTextColorDict} className="text-sm">Display page numbers</span>
                <Button style={styleBackgroundColorDict} variant="outline" size="sm" onClick={togglePageNumbers}>
                  <span style={styleTextColorDict} id="togglePageNumbersStatusSpan">{getPageNumbersStatus()}</span>
                </Button>
              </div>
              <div className="space-y-2">
                <Label style={styleTextColorDict} htmlFor="minLengthToSummarizePicker">
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
                  style={{ ...styleBackgroundColorDict, ...styleTextColorDict }}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label style={styleTextColorDict} htmlFor="targetSummaryLengthPicker">
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
                  style={{ ...styleBackgroundColorDict, ...styleTextColorDict }}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label style={styleTextColorDict} htmlFor="backgroundColorPicker">
                  Background Color
                </Label>
                <input
                  type="color"
                  id="backgroundColorPicker"
                  onChange={updateBackgroundColorSetting}
                  defaultValue={settings.backgroundColor}
                  style={styleBackgroundColorDict}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label style={styleTextColorDict} htmlFor="backgroundColorPicker">
                  Middleground Color
                </Label>
                <input
                  type="color"
                  id="middlegroundColorPicker"
                  onChange={updateMiddlegroundColorSetting}
                  defaultValue={settings.middlegroundColor}
                  style={styleBackgroundColorDict}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label style={styleTextColorDict} htmlFor="textColorPicker">
                  Text Color
                </Label>
                <input
                  type="color"
                  id="textColorPicker"
                  onChange={updateTextColorSetting}
                  defaultValue={settings.textColor}
                  style={styleBackgroundColorDict}
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
