"use client"

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout";

//this file written originally by Daniel Briggs then debugged and fixed using Copilot

export default function Page() {
  const defaultSettings = {
    "AIDefaultShortening": false,
    "AIFullDocumentSummary": false,
    "displayPageNumbers": true,
    "backgroundColor": "#FFFFFF",
    "textColor": "#000000",
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
    settings.AIFullDocumentSummary = !settings.AIFullDocumentSummary
    document.getElementById("toggleAIFullDocumentSummaryStatusSpan")!.textContent = getAIFullDocumentSummaryStatus();
  
    saveSettings();
  }
  function togglePageNumbers() {
    settings.displayPageNumbers = !settings.displayPageNumbers
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
  function updateTextColorSetting(event: React.ChangeEvent<HTMLInputElement>) {
    settings.textColor = event.target.value;

    saveSettings();
  }
  




  const styleBackgroundColorDict = {
    backgroundColor: settings.backgroundColor,
  }

  const styleTextColorDict = {
    color: settings.textColor,
  }

  
  
  //these functions generate the enabled and disabled text for the boolean value settings, they are separate functions since they are also called again when updating the settings
  function getAIDefaultShorteningStatus() {
    return settings.AIDefaultShortening ? "enabled" : "disabled"
  }
  function getAIFullDocumentSummaryStatus() {
    return settings.AIFullDocumentSummary ? "enabled" : "disabled"
  }
  function getPageNumbersStatus() {
    return settings.displayPageNumbers ? "enabled" : "disabled"
  }

  return (
    <>
      <Header />
      <main className="min-h-screen p-8" style={styleBackgroundColorDict}>
        <h1 className="text-3xl text-gray-600" style={styleTextColorDict}>PDF Reader Settings</h1>
        <a href="pdf-reading" className="underline" style={styleTextColorDict}>Back to PDF Reading</a>
        <ul className="flex flex-col gap-2 items-start" style={styleTextColorDict}>
          <button id="toggleAIDefaultShorteningButton" onClick={toggleAIDefaultShortening}>AI shorten paragraphs by default. <span id="toggleAIDefaultShorteningStatusSpan">{getAIDefaultShorteningStatus()}</span></button>
          {/*<button onClick={toggleAIFullDocumentSummary}>AI full document summary (appears above document&apos;s content) <span id="toggleAIFullDocumentSummaryStatusSpan">{getAIFullDocumentSummaryStatus()}</span></button>*/ /*Disable this setting for now since it causes the page to fail to load (and probably too much API usage as well)*/}
          <button onClick={togglePageNumbers}>Display page numbers? <span id="togglePageNumbersStatusSpan">{getPageNumbersStatus()}</span></button>
          <span>Choose the minimum length a paragraph must be in order for the toggle AI summary button to appear (press tab to enter the number input field): <input type="number" min="50" max="1000" step="25" id="minLengthToSummarizePicker" onChange={updateMinLengthToSummarize} defaultValue={settings.minLengthToSummarize}></input></span>
          <span>Choose the target percentage of a shortened paragraph relative to the original version (press tab to enter the number input field): <input type="number" min="20" max="99" step="2" id="targetSummaryLengthPicker" onChange={updateTargetSummaryLength} defaultValue={settings.targetSummaryLength}></input></span>
          
          <h2 style={styleTextColorDict}>The two settings below change the colors used on the pdf reading pages (please reload the page to see the new settings take effect):</h2>
          <label htmlFor="background">Choose a background color:</label> <input name="background" type="color" id="backgroundColorPicker" defaultValue={settings.backgroundColor} onChange={updateBackgroundColorSetting} aria-label="background color picker"></input>
          <label htmlFor="textColor">Choose a text color:</label> <input name="textColor" type="color" id="textColorPicker" defaultValue={settings.textColor} onChange={updateTextColorSetting} aria-label="text color picker"></input>
        </ul>       
      </main>
    </>
  );
}
