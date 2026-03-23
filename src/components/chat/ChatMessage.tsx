import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { Bot, User } from "lucide-react";
import React from "react";

interface ChatMessageProps {
  message: Message;
}

/**
 * Formats raw chat content into clean React elements:
 * - Strips markdown # headings and renders them as bold headings
 * - Strips ** / * bold/italic markers and renders bold text
 * - Converts raw URLs into clickable links
 * - Removes [Link] or [link] text artifacts
 * - Removes takeaway sections
 */
function formatContent(content: string): React.ReactNode[] {
  // Remove takeaway sections at the end
  const takeawayPattern =
    /\n*(Key Takeaways|Takeaways|Summary Takeaways)[:\s]*\n([\s\S]*?)$/i;
  let cleaned = content.replace(takeawayPattern, "").trimEnd();

  const lines = cleaned.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Strip markdown heading prefixes (##, ###, #) and render as bold heading
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const headingText = stripInlineMarkdown(headingMatch[2]);
      elements.push(
        <p key={i} className="font-bold text-base mt-3 mb-1">
          {renderInlineContent(headingText, `h-${i}`)}
        </p>
      );
      continue;
    }

    // Detect standalone heading lines (ALL CAPS or Title Case lines with no punctuation ending)
    // Only if the line is short and the next line is blank or end of content
    const isStandaloneHeading =
      line.trim().length > 0 &&
      line.trim().length < 80 &&
      /^[A-Z][A-Za-z0-9\s:&\-–—,/]*$/.test(line.trim()) &&
      !/[.!?;]$/.test(line.trim()) &&
      (i === lines.length - 1 || lines[i + 1]?.trim() === "");

    if (isStandaloneHeading && !line.trim().match(/^\d+\.\s/)) {
      elements.push(
        <p key={i} className="font-bold text-base mt-3 mb-1">
          {renderInlineContent(line.trim(), `sh-${i}`)}
        </p>
      );
      continue;
    }

    // Empty lines become spacing
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Regular text line
    const processedLine = stripInlineMarkdown(line);
    elements.push(
      <p key={i} className="text-sm leading-relaxed">
        {renderInlineContent(processedLine, `p-${i}`)}
      </p>
    );
  }

  return elements;
}

/**
 * Strip inline markdown markers (**, *, __) and [Link] artifacts from text
 */
function stripInlineMarkdown(text: string): string {
  // Remove [Link] or [link] artifacts
  let result = text.replace(/\[Link\]/gi, "");
  // Remove markdown link syntax [text](url) → text url
  result = result.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1 $2");
  // Remove bold markers **text** → text
  result = result.replace(/\*\*([^*]+)\*\*/g, "$1");
  // Remove italic markers *text* → text
  result = result.replace(/\*([^*]+)\*/g, "$1");
  // Remove underscore bold __text__
  result = result.replace(/__([^_]+)__/g, "$1");
  // Remove underscore italic _text_
  result = result.replace(/_([^_]+)_/g, "$1");
  // Clean up any double spaces
  result = result.replace(/\s{2,}/g, " ").trim();
  return result;
}

/**
 * Render inline content: detect URLs and make them clickable,
 * detect **bold** patterns and render as <strong>
 */
function renderInlineContent(
  text: string,
  keyPrefix: string
): React.ReactNode[] {
  // Split on URLs and bold markers
  const urlRegex = /(https?:\/\/[^\s,)]+)/g;
  const parts = text.split(urlRegex);
  const nodes: React.ReactNode[] = [];

  parts.forEach((part, idx) => {
    if (urlRegex.test(part)) {
      // Reset regex lastIndex
      urlRegex.lastIndex = 0;
      nodes.push(
        <a
          key={`${keyPrefix}-${idx}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring break-all"
        >
          {part}
        </a>
      );
    } else if (part) {
      nodes.push(<React.Fragment key={`${keyPrefix}-${idx}`}>{part}</React.Fragment>);
    }
  });

  return nodes;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-4",
        isAssistant && "bg-muted/50"
      )}
      role="article"
      aria-label={`${isAssistant ? "Tack" : "You"}: ${message.content.slice(0, 50)}${message.content.length > 50 ? "..." : ""}`}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
          isAssistant ? "bg-primary text-primary-foreground" : "bg-background"
        )}
        aria-hidden="true"
      >
        {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>
      <div className="flex-1 space-y-1 overflow-hidden">
        <p className="text-sm font-medium">
          {isAssistant ? "Tack" : "You"}
        </p>
        <div className="max-w-none">
          {isAssistant
            ? formatContent(message.content)
            : <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          }
        </div>
        {message.metadata?.source_url && (
          <p className="text-xs text-muted-foreground mt-2">
            Source:{" "}
            <a
              href={message.metadata.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {message.metadata.source_url}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
