/**
 * url-fetcher.ts — Server-side utility to fetch a web page and extract
 * its readable text content.  Used by /summarize and /read commands.
 *
 * Runs only on the server (Next.js API routes).
 */

/** Maximum response body size we'll accept (2 MB). */
const MAX_BODY_BYTES = 2 * 1024 * 1024;

/** Maximum characters of extracted text to send to the AI model. */
const MAX_TEXT_CHARS = 12_000;

/** Timeout for the fetch request in milliseconds. */
const FETCH_TIMEOUT_MS = 15_000;

export interface FetchResult {
    ok: boolean;
    url: string;
    title: string;
    text: string;
    error?: string;
}

/**
 * Fetch a URL and extract its readable text content.
 * Strips HTML tags, collapses whitespace, and truncates to MAX_TEXT_CHARS.
 */
export async function fetchUrlContent(url: string): Promise<FetchResult> {
    // Validate / normalise the URL
    let parsedUrl: URL;
    try {
        // Prepend https:// if no protocol is provided
        if (!/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
        }
        parsedUrl = new URL(url);
    } catch {
        return { ok: false, url, title: "", text: "", error: "Invalid URL." };
    }

    // Only allow http(s)
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return {
            ok: false,
            url,
            title: "",
            text: "",
            error: "Only HTTP and HTTPS URLs are supported.",
        };
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        const response = await fetch(parsedUrl.href, {
            signal: controller.signal,
            headers: {
                // Identify as a standard browser so sites don't block us
                "User-Agent":
                    "Mozilla/5.0 (compatible; TackBot/1.0; +https://tack.app)",
                Accept: "text/html, application/xhtml+xml, text/plain, */*",
            },
            redirect: "follow",
        });

        clearTimeout(timeout);

        if (!response.ok) {
            return {
                ok: false,
                url: parsedUrl.href,
                title: "",
                text: "",
                error: `Server returned ${response.status} ${response.statusText}.`,
            };
        }

        const contentType = response.headers.get("content-type") || "";

        // Reject non-text responses (PDFs, images, etc.)
        if (
            !contentType.includes("text/") &&
            !contentType.includes("application/xhtml") &&
            !contentType.includes("application/xml") &&
            !contentType.includes("application/json")
        ) {
            return {
                ok: false,
                url: parsedUrl.href,
                title: "",
                text: "",
                error: `Unsupported content type: ${contentType}. Only text/HTML pages are supported.`,
            };
        }

        // Read body with size limit
        const rawBody = await readBodyWithLimit(response, MAX_BODY_BYTES);

        if (contentType.includes("application/json")) {
            // For JSON, just pretty-print it
            const truncated = rawBody.slice(0, MAX_TEXT_CHARS);
            return {
                ok: true,
                url: parsedUrl.href,
                title: parsedUrl.hostname,
                text: truncated,
            };
        }

        // Extract readable content from HTML
        const title = extractTitle(rawBody);
        const text = extractText(rawBody);
        const truncated = text.slice(0, MAX_TEXT_CHARS);

        return {
            ok: true,
            url: parsedUrl.href,
            title: title || parsedUrl.hostname,
            text: truncated,
        };
    } catch (err: unknown) {
        const message =
            err instanceof Error ? err.message : "Unknown error fetching URL.";
        if (message.includes("abort")) {
            return {
                ok: false,
                url: parsedUrl.href,
                title: "",
                text: "",
                error: "Request timed out after 15 seconds.",
            };
        }
        return {
            ok: false,
            url: parsedUrl.href,
            title: "",
            text: "",
            error: message,
        };
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read the response body up to `maxBytes`, then stop. */
async function readBodyWithLimit(
    response: Response,
    maxBytes: number
): Promise<string> {
    // If the body is available as text, just read it
    const text = await response.text();
    if (text.length > maxBytes) {
        return text.slice(0, maxBytes);
    }
    return text;
}

/**
 * Extract a <title> from raw HTML using regex.
 * No DOM parser needed — keeps the bundle server-side friendly.
 */
function extractTitle(html: string): string {
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return match ? decodeEntities(match[1].trim()) : "";
}

/**
 * Extract readable text from HTML:
 * 1. Remove <script>, <style>, <noscript>, <svg>, <head> blocks.
 * 2. Convert <br>, <p>, <div>, <li>, headings to newlines.
 * 3. Strip all remaining HTML tags.
 * 4. Decode common HTML entities.
 * 5. Collapse whitespace.
 */
function extractText(html: string): string {
    let text = html;

    // Remove non-visible blocks
    text = text.replace(
        /<(script|style|noscript|svg|head|nav|footer|iframe)[^>]*>[\s\S]*?<\/\1>/gi,
        " "
    );

    // Remove HTML comments
    text = text.replace(/<!--[\s\S]*?-->/g, " ");

    // Convert block elements to newlines
    text = text.replace(/<\/?(p|div|br|h[1-6]|li|tr|blockquote|section|article|header|main)[^>]*\/?>/gi, "\n");

    // Strip remaining tags
    text = text.replace(/<[^>]+>/g, " ");

    // Decode entities
    text = decodeEntities(text);

    // Collapse whitespace: multiple spaces → single space, multiple newlines → double newline
    text = text
        .split("\n")
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter((line) => line.length > 0)
        .join("\n");

    return text.trim();
}

/** Decode common HTML entities. */
function decodeEntities(text: string): string {
    return text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;|&apos;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
        .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
        );
}
