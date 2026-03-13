"use client"

import React, { useState } from "react";

type Props = {
    headingLevel: number;
    content: string;
    onOpen?: (content: string) => void;
    summarizePercent?: number; // percent to shorten by when summarizing
};

export const PdfReadableLine: React.FC<Props> = ({ headingLevel, content, onOpen, summarizePercent = 30 }) => {
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

    async function fetchSummary() {
    setLoading(true);
    try {
        const res = await fetch("/api/insforge/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, percent: summarizePercent }),
        });
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
        alert("Toggling sumary for: " + content);
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

        await fetchSummary();
        setFading(true);
        setTimeout(() => {
            setIsSummary(true);
            setFading(false);
        }, 180);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key && e.key.toLowerCase() === "o") {
            doToggle();
        }
    };

    const display = isSummary && summaryText ? summaryText : content;
    const summaryStyle = isSummary ? "italic font-semibold" : "";
    const fadeClass = fading ? "opacity-30 scale-95" : "opacity-100 scale-100";

    return (
    <div tabIndex={0} onKeyDown={handleKeyDown} className="focus:outline-none">
        <p className={`${baseClass} transition-transform transition-opacity duration-200 ${summaryStyle} ${fadeClass}`}>
        {loading ? `${display}…` : display}
        </p>
    </div>
    );
};

export default PdfReadableLine;
