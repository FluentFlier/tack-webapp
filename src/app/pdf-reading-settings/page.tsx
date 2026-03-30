"use client"

import React, { useEffect, useRef, useState } from "react";
import { Header } from "@/components/layout";



export default function Page() {


  let settings = {
    "AIDefaultShortening": false,
    "AIFullDocumentSummary": false,
    "displayPageNumbers": true,
    "backgroundColor": "#FFFFFF",
    "textColor": "#000000",
  }
  function saveSettings() {
    //eventually save settings to Insforge backend, at the moment this is just a stub
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


  return (
    <>
      <Header />
      <main className="min-h-screen p-8">
        <h1 className="text-3xl text-gray-600">PDF Reader Settings</h1>
        <a href="pdf-reading">Back to PDF Reading</a>
        <ul className="flex-direction">
          <button onClick={toggleAIDefaultShortening}>AI shorten paragraphs by default. {settings.AIDefaultShortening ? "enabled" : "disabled"}</button>
          <button onClick={toggleAIFullDocumentSummary}>AI full document summary (appears above document's content) {settings.AIFullDocumentSummary ? "enabled" : "disabled"}</button>
          <button onClick={togglePageNumbers}>Display page numbers? {settings.displayPageNumbers ? "enabled" : "disabled"}</button>
          <span>Choose a background color: <input type="color" id="backgroundColorPicker" onChange={updateBackgroundColorSetting}></input></span>
          <span>Choose a text color: <input type="color" id="textColorPicker" onChange={updateTextColorSetting}></input></span>
        </ul>       
      </main>
    </>
  );
}
