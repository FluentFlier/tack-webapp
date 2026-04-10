//this file written almost entirely by Copilot to display a line/paragraph of text. Settings were added to modify the colors of the text and summarization settigngs.
//rate limiting and account needing to be signed in notifications were added using Copilot, basically when a rate limit error is encountered a function is the pdf-reader component is called (this makes sure an alert about the error is only shown once per page load, instead of once per error)

import React, { useEffect, useRef, useState } from "react";

type Props = {
    headingLevel: number;
    content: string;
    onOpen?: (content: string) => void;
    onRateLimit?: () => void;
    onUnauthorized?: () => void;
    summarizePercent?: number; // percent to shorten by when summarizing
    defaultToSummary: boolean;
    minLengthToSummarize: number;
};

export const PdfReadableLine: React.FC<Props> = ({ headingLevel, content, onOpen, onRateLimit, onUnauthorized, summarizePercent = 50, defaultToSummary = false, minLengthToSummarize = 1000}) => {
    const classMap: Record<number, string> = {
    1: "text-2xl font-bold mt-4 mb-2",
    2: "text-xl font-bold mt-3 mb-1.5",
    3: "text-lg mt-2 mb-1",
    4: "text-md mt-1.5 mb-1",
    5: "text-base mt-1 mb-0.5",
    6: "text-sm mt-1 mb-0.5",
    };

    const baseClass = classMap[headingLevel] ?? classMap[6];

    const [isSummary, setIsSummary] = useState(false);
    const [summaryText, setSummaryText] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fading, setFading] = useState(false);
    const didInitDefaultSummary = useRef(false);

    async function fetchSummary() {
        setLoading(true);
        try {
            const res = await fetch("/api/insforge/shorten", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: content, percent: summarizePercent }),
            });
            if (res.status === 429) {
                onRateLimit?.();
            }
            if (res.status === 401) {
                onUnauthorized?.();
            }
            
            if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || "Summarize request failed");
            }
            const json = await res.json();
            const s = json.shortened ?? null;
            if (s) setSummaryText(s);
        } catch (err) {
            console.error("Failed to fetch summary:", err);
        } finally {
            setLoading(false);
        }
    }

    const doToggle = async () => {
        //alert("Toggling sumary for: " + content);
        if (isSummary) {
            // animate back to original
            setFading(true);
            setTimeout(() => {
            setIsSummary(false);
            setFading(false);
            }, 180);
            return;
        }

        if (summaryText) {
            setFading(true);
            setTimeout(() => {
            setIsSummary(true);
            setFading(false);
            }, 180);
            return;
        }

        //if a summary hasn't been generated yet, then this code will fetch and display one
        await fetchSummary();
        setFading(true);
        setTimeout(() => {
            setIsSummary(true);
            setFading(false);
        }, 180);
    };

    //this useEffect written by Copilot to generate an AI shortened version if defaultToSummary is true and only run this once not multiple times per line
    // Initialize default summary once per line instance when enabled.
    useEffect(() => {
        if (!defaultToSummary) return;
        if (didInitDefaultSummary.current) return;
        if (content.length <= minLengthToSummarize) return;

        didInitDefaultSummary.current = true;
        //console.log("toggling summary");

        
        
        doToggle();

    }, [defaultToSummary, content, minLengthToSummarize, summaryText]);
    

    const display = isSummary && summaryText ? summaryText : content;
    const summaryStyle = isSummary ? "italic font-semibold" : "";
    const fadeClass = fading ? "opacity-30 scale-95" : "opacity-100 scale-100";

    const longEnoughToSummarize = content.length > minLengthToSummarize;

   
    
    let summarizeButton = <button className="text-xs text-muted-foreground underline mb-1" onClick={doToggle}>summarize line? {`${isSummary ? "enabled" : "disabled"}`}</button>;
    
    return (
    <div tabIndex={0}  className="focus:outline-none">
        {longEnoughToSummarize ? summarizeButton : ''}
        <p className={`${baseClass} transition-transform transition-opacity duration-200 ${summaryStyle} ${fadeClass}`}>
        {loading ? `${display}…` : display}
        </p>
    </div>
    );
};

export default PdfReadableLine;
