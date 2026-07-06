import React from "react";

// Editorial Pine & Oat classes — token-driven so they respond to light/dark.
// Headings use Playfair Display via .app-md-h2/h3/h4 (defined in globals.css).
// List items use .app-md-li for the pine bullet pseudo-element.
const CLS = {
  h2: "app-md-h2",
  h3: "app-md-h3",
  h4: "app-md-h4",
  p: "text-[0.9375rem] leading-[1.78] text-foreground mb-3.5",
  ul: "list-none pl-0 my-1 mb-4 text-[0.9375rem] text-foreground",
  ol: "list-decimal list-outside pl-5 space-y-2 my-1 mb-4 text-[0.9375rem] text-foreground",
  li: "app-md-li",
  a: "text-[hsl(var(--primary))] underline underline-offset-2 decoration-[1px] font-medium hover:text-[hsl(var(--accent-strong))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] break-all transition-colors",
};

const TAKEAWAY_RE =
  /\n*(Key Takeaways|Takeaways|Summary Takeaways)[:\s]*\n([\s\S]*?)$/i;
const HEADING_RE = /^(#{1,6})\s+(.+)$/;
const OL_RE = /^\d+\.\s+(.+)$/;
const UL_RE = /^[-*]\s+(.+)$/;

// ── Inline renderer ──────────────────────────────────────────────────────────

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Tokenise: markdown links first, then bold, then bare URLs.
  // Known limitation: bare URLs containing unescaped parentheses
  // (e.g. https://en.wikipedia.org/wiki/Rust_(programming_language)) are
  // truncated at the closing paren. Use explicit Markdown link syntax as a
  // workaround: [Rust](https://en.wikipedia.org/wiki/Rust_(programming_language))
  const TOKEN_RE =
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s,)[\]]+)/g;

  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(text)) !== null) {
    const [full, linkText, linkUrl, boldText, bareUrl] = match;

    // Text before this token
    if (match.index > last) {
      nodes.push(
        <React.Fragment key={`${keyPrefix}-t-${idx++}`}>
          {text.slice(last, match.index)}
        </React.Fragment>
      );
    }

    if (linkText && linkUrl) {
      nodes.push(
        <a
          key={`${keyPrefix}-a-${idx++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={CLS.a}
        >
          {linkText}
        </a>
      );
    } else if (boldText) {
      nodes.push(<strong key={`${keyPrefix}-b-${idx++}`}>{boldText}</strong>);
    } else if (bareUrl) {
      nodes.push(
        <a
          key={`${keyPrefix}-u-${idx++}`}
          href={bareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={CLS.a}
        >
          {bareUrl}
        </a>
      );
    }

    last = match.index + full.length;
  }

  // Remaining text
  if (last < text.length) {
    nodes.push(
      <React.Fragment key={`${keyPrefix}-t-${idx++}`}>
        {text.slice(last)}
      </React.Fragment>
    );
  }

  return nodes;
}

// ── Standalone heading heuristic (backward compat for plain-text history) ────
// Restricted to ALL-CAPS lines only (every letter character is uppercase)
// to avoid misidentifying normal sentences as headings.

function isLegacyHeading(line: string, nextLine: string | undefined): boolean {
  const t = line.trim();
  return (
    t.length > 0 &&
    t.length < 80 &&
    // All letter characters must be uppercase (pure ALL-CAPS line)
    /^[A-Z0-9\s:&\-–—,/]+$/.test(t) &&
    !/[.!?;]$/.test(t) &&
    (nextLine === undefined || nextLine.trim() === "")
  );
}

// ── Block types ───────────────────────────────────────────────────────────────

type ListBlock = { kind: "ul" | "ol"; items: string[] };
type Block =
  | { kind: "heading"; level: 2 | 3 | 4; text: string }
  | { kind: "p"; text: string }
  | { kind: "blank" }
  | ListBlock;

// ── Block parser ──────────────────────────────────────────────────────────────

function parseBlocks(content: string): Block[] {
  // Strip takeaway sections before parsing
  const cleaned = content.replace(TAKEAWAY_RE, "").trimEnd();
  const lines = cleaned.split("\n");
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Markdown heading — strip optional trailing hashes (e.g. "## Intro ##")
    const hm = line.match(HEADING_RE);
    if (hm) {
      const hashes = hm[1].length;
      const level: 2 | 3 | 4 =
        hashes <= 2 ? 2 : hashes === 3 ? 3 : 4;
      const text = hm[2].replace(/\s+#+\s*$/, "");
      blocks.push({ kind: "heading", level, text });
      i++;
      continue;
    }

    // Ordered list — consume all consecutive ol lines
    if (OL_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && OL_RE.test(lines[i])) {
        items.push(lines[i].match(OL_RE)![1]);
        i++;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }

    // Unordered list — consume all consecutive ul lines
    if (UL_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && UL_RE.test(lines[i])) {
        items.push(lines[i].match(UL_RE)![1]);
        i++;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      blocks.push({ kind: "blank" });
      i++;
      continue;
    }

    // Legacy ALL-CAPS / Title Case heading (plain-text history backward compat)
    if (isLegacyHeading(line, lines[i + 1]) && !line.trim().match(/^\d+\.\s/)) {
      blocks.push({ kind: "heading", level: 3, text: line.trim() });
      i++;
      continue;
    }

    // Plain paragraph
    blocks.push({ kind: "p", text: line });
    i++;
  }

  return blocks;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render a markdown string as an array of React elements.
 * Supports: ## headings, ol/ul lists, [text](url) links, bare URLs, **bold**, paragraphs.
 * Strips Key Takeaways sections.
 * Falls back gracefully for plain-text (pre-markdown) messages.
 * No dangerouslySetInnerHTML — all React elements.
 */
export function renderMarkdown(content: string): React.ReactNode[] {
  if (!content) return [];

  const blocks = parseBlocks(content);
  const elements: React.ReactNode[] = [];

  blocks.forEach((block, bi) => {
    const key = `block-${bi}`;

    switch (block.kind) {
      case "heading": {
        const Tag = (`h${block.level}`) as "h2" | "h3" | "h4";
        const cls =
          block.level === 2 ? CLS.h2 : block.level === 3 ? CLS.h3 : CLS.h4;
        elements.push(
          <Tag key={key} className={cls}>
            {renderInline(block.text, key)}
          </Tag>
        );
        break;
      }

      case "ul":
        elements.push(
          <ul key={key} className={CLS.ul}>
            {block.items.map((item, ii) => (
              <li key={`${key}-li-${ii}`} className={CLS.li}>
                {renderInline(item, `${key}-li-${ii}`)}
              </li>
            ))}
          </ul>
        );
        break;

      case "ol":
        elements.push(
          <ol key={key} className={CLS.ol}>
            {block.items.map((item, ii) => (
              <li key={`${key}-li-${ii}`} className={CLS.li}>
                {renderInline(item, `${key}-li-${ii}`)}
              </li>
            ))}
          </ol>
        );
        break;

      case "blank":
        elements.push(<div key={key} className="h-2" />);
        break;

      case "p":
        elements.push(
          <p key={key} className={CLS.p}>
            {renderInline(block.text, key)}
          </p>
        );
        break;
    }
  });

  return elements;
}
