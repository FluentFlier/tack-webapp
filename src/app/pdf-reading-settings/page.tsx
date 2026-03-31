"use client"

import React, { useEffect, useRef, useState } from "react";
import { Header } from "@/components/layout";



export default function Page() {
  const defaultSettings = {
    "AIDefaultShortening": false,
    "AIFullDocumentSummary": false,
    "displayPageNumbers": true,
    "backgroundColor": "#FFFFFF",
    "textColor": "#000000",
  };

  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    const savedSettings = localStorage.getItem("pdfReaderSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    } else {
      setSettings(defaultSettings);
    }
  }, []);

  function saveSettings() {
    saveSettingsLocalStorage(settings);
    //eventually save settings to Insforge backend, at the moment this is just a stub
  }

  function saveSettingsLocalStorage(updatedSettings: typeof settings) {
    localStorage.setItem("pdfReaderSettings", JSON.stringify(updatedSettings));
  }


  function toggleAIDefaultShortening() {
    settings.AIDefaultShortening = !settings.AIDefaultShortening
    saveSettings()
  }
  function toggleAIFullDocumentSummary() {
    settings.AIFullDocumentSummary = !settings.AIFullDocumentSummary
    saveSettings()
  }
  function togglePageNumbers() {
    settings.displayPageNumbers = !settings.displayPageNumbers
    saveSettings()
  }
  function updateBackgroundColorSetting(){
    settings.backgroundColor = (document.getElementById("backgroundColorPicker") as HTMLInputElement).value;
    saveSettings()
  }
  function updateTextColorSetting() {
    settings.textColor = (document.getElementById("textColorPicker") as HTMLInputElement).value
    saveSettings()
  }

  const styleBackgroundColorDict = {
    backgroundColor: settings.backgroundColor,
  }

  const styleTextColorDict = {
    color: settings.textColor,
  }
  return (
    <>
      <Header />
      <main className="min-h-screen p-8" style={styleBackgroundColorDict}>
        <h1 className="text-3xl text-gray-600" style={styleTextColorDict}>PDF Reader Settings</h1>
        <a href="pdf-reading" className="underline" style={styleTextColorDict}>Back to PDF Reading</a>
        <ul className="flex flex-col gap-2 items-start" style={styleTextColorDict}>
          <button onClick={toggleAIDefaultShortening}>AI shorten paragraphs by default. {settings.AIDefaultShortening ? "enabled" : "disabled"}</button>
          <button onClick={toggleAIFullDocumentSummary}>AI full document summary (appears above document's content) {settings.AIFullDocumentSummary ? "enabled" : "disabled"}</button>
          <button onClick={togglePageNumbers}>Display page numbers? {settings.displayPageNumbers ? "enabled" : "disabled"}</button>

          <p style={styleTextColorDict}>The two settings below change the colors used on the pdf reading pages, they will only take effect after reloading the page:</p>
          <span>Choose a background color: <input type="color" id="backgroundColorPicker" defaultValue={settings.backgroundColor} onChange={updateBackgroundColorSetting}></input></span>
          <span>Choose a text color: <input type="color" id="textColorPicker" defaultValue={settings.textColor} onChange={updateTextColorSetting}></input></span>
        </ul>       
      </main>
    </>
  );
}
