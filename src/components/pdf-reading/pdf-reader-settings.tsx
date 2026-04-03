"use client"

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout";

//this file written originally by Daniel Briggs then debugged and fixed using Copilot

export default async function Page() {
  const defaultSettings = {
    "AIDefaultShortening": false,
    "AIFullDocumentSummary": false,
    "displayPageNumbers": true,
    "backgroundColor": "#FFFFFF",
    "textColor": "#000000",
  };

  type PDFReaderSettings = typeof defaultSettings;

  //this function written using Copilot inline suggestions then edited
  function getInitialSettings() {
    
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

  const [settings, setSettings] = useState(getInitialSettings());

  function saveSettings() {
    saveSettingsLocalStorage(settings);
    //eventually save settings to Insforge backend, at the moment this is just a stub
  }

  useEffect(() => {
    saveSettings()
  }, [settings]) //save settings whenever they are updated


  function saveSettingsLocalStorage(updatedSettings: typeof settings) {
    localStorage.setItem("pdfReaderSettings", JSON.stringify(updatedSettings));
  }


  //Copilot was used to modify each of these toggle functions to use setSettings instead of directly modifying settings, as well as using React.ChangeEvents instead of document.getElementByID
  function toggleAIDefaultShortening() {
    setSettings((prev : PDFReaderSettings) => ({
      ...prev,
      AIDefaultShortening: !prev.AIDefaultShortening,
    }));
  }
  function toggleAIFullDocumentSummary() {
    setSettings((prev: PDFReaderSettings) => ({
      ...prev,
      AIFullDocumentSummary: !prev.AIFullDocumentSummary,
    }));
  }
  function togglePageNumbers() {
    setSettings((prev: PDFReaderSettings) => ({
      ...prev,
      displayPageNumbers: !prev.displayPageNumbers,
    }));
  }
  function updateBackgroundColorSetting(event: React.ChangeEvent<HTMLInputElement>) {
    setSettings((prev: PDFReaderSettings) => ({
      ...prev,
      backgroundColor: event.target.value,
    }));
  }
  function updateTextColorSetting(event: React.ChangeEvent<HTMLInputElement>) {
    setSettings((prev: PDFReaderSettings) => ({
      ...prev,
      textColor: event.target.value,
    }));
  }




  const initialSettings = getInitialSettings();

  const styleBackgroundColorDict = {
    backgroundColor: initialSettings.backgroundColor,
  }

  const styleTextColorDict = {
    color: initialSettings.textColor,
  }

  
  
  
  return (
    <>
      <Header />
      <main className="min-h-screen p-8" style={styleBackgroundColorDict}>
        <h1 className="text-3xl text-gray-600" style={styleTextColorDict}>PDF Reader Settings</h1>
        <a href="pdf-reading" className="underline" style={styleTextColorDict}>Back to PDF Reading</a>
        <ul className="flex flex-col gap-2 items-start" style={styleTextColorDict}>
          <button onClick={toggleAIDefaultShortening}>AI shorten paragraphs by default. {initialSettings.AIDefaultShortening ? "enabled" : "disabled"}</button>
          <button onClick={toggleAIFullDocumentSummary}>AI full document summary (appears above document's content) {initialSettings.AIFullDocumentSummary ? "enabled" : "disabled"}</button>
          <button onClick={togglePageNumbers}>Display page numbers? {initialSettings.displayPageNumbers ? "enabled" : "disabled"}</button>

          <p style={styleTextColorDict}>The two settings below change the colors used on the pdf reading pages:</p>
          <span>Choose a background color: <input type="color" id="backgroundColorPicker" value={initialSettings.backgroundColor} onChange={updateBackgroundColorSetting}></input></span>
          <span>Choose a text color: <input type="color" id="textColorPicker" value={initialSettings.textColor} onChange={updateTextColorSetting}></input></span>
        </ul>       
      </main>
    </>
  );
}
