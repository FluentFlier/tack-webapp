import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { createClient } from "@insforge/sdk";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { checkRateLimit } from "@/lib/rate-limit";
import { extractSchema, assertPublicUrl, withTimeout } from "@/lib/validation";
import { fetchImageAsDataUrl } from "@/lib/image-fetch";

const MAX_REDIRECTS = 3;

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await auth();
    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowed } = checkRateLimit(`extract:${userId}`, 10, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = extractSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    // SSRF guard: validate the URL and every redirect destination
    let validatedUrl: URL;
    try {
      validatedUrl = await assertPublicUrl(parsed.data.url);
    } catch (e) {
      return NextResponse.json(
        { error: (e as Error).message ?? "Invalid URL" },
        { status: 400 }
      );
    }

    // Follow redirects manually so we can re-validate each Location header
    let currentUrl = validatedUrl.href;
    let response!: Response;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      response = await fetch(currentUrl, {
        headers: {
          "User-Agent": "Tack/1.0 (Accessibility Assistant)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(10000),
        redirect: "manual",
      });

      if (response.status >= 300 && response.status < 400) {
        if (hop === MAX_REDIRECTS) {
          return NextResponse.json(
            { error: "Too many redirects" },
            { status: 502 }
          );
        }
        const location = response.headers.get("Location");
        if (!location) {
          return NextResponse.json(
            { error: "Redirect with no Location header" },
            { status: 502 }
          );
        }
        // Resolve relative redirects against the current URL
        const absoluteLocation = new URL(location, currentUrl).href;
        try {
          const nextUrl = await assertPublicUrl(absoluteLocation);
          currentUrl = nextUrl.href;
        } catch (e) {
          return NextResponse.json(
            {
              error: `Redirect blocked: ${(e as Error).message ?? "Invalid redirect target"}`,
            },
            { status: 400 }
          );
        }
        continue;
      }

      break;
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (${response.status})` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url: currentUrl });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return NextResponse.json(
        { error: "Could not extract content from this page" },
        { status: 422 }
      );
    }

    const articleDom = new JSDOM(article.content || "");
    const imgElements = articleDom.window.document.querySelectorAll("img");
    const images = Array.from(imgElements)
      .map((img) => ({
        src: img.getAttribute("src") || "",
        alt: img.getAttribute("alt") || "",
      }))
      .filter((img) => img.src);

    // Generate vision-based alt text for images missing it (limit to 5).
    // Each image is fetched as a base64 data URL and sent to gpt-4o-mini as a
    // multimodal content part so the model describes actual pixels — never a
    // filename-derived guess. Any failure (SSRF block, bad content-type, too
    // large, gateway error, empty response) yields an honest fallback so that
    // blind users always receive truthful information.
    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL!,
      edgeFunctionToken: token,
    });

    // Process images sequentially to avoid holding multiple ~5 MB base64
    // payloads in memory simultaneously (serverless memory constraint).
    const imagesWithAlt: typeof images = [];
    for (const img of images.slice(0, 5)) {
      if (img.alt) {
        imagesWithAlt.push(img);
        continue;
      }
      try {
        // Resolve relative src against the final page URL
        const absoluteSrc = new URL(img.src, currentUrl).href;

        // SSRF guard: block private/reserved addresses
        await assertPublicUrl(absoluteSrc);

        // Fetch image body; rejects redirects and enforces 4 MB cap
        const { dataUrl } = await fetchImageAsDataUrl(absoluteSrc);

        // Vision completion — model sees actual pixels
        const completion = await withTimeout(
          insforge.ai.chat.completions.create({
            model: "openai/gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Write concise alt text for this image in under 125 characters. Describe only what is visible. Do not start with 'Image of'. Output only the alt text.",
                  },
                  {
                    type: "image_url",
                    image_url: { url: dataUrl },
                  },
                ],
              },
            ],
            maxTokens: 100,
          }),
          60000,
          "Alt text completion"
        );

        const alt = completion.choices[0]?.message?.content?.trim();
        if (!alt) throw new Error("Empty alt text completion");

        imagesWithAlt.push({ ...img, alt, generated: true } as typeof img & { alt: string; generated: boolean });
      } catch {
        // Any failure: honest fallback — never fabricate from the filename
        imagesWithAlt.push({
          ...img,
          alt: "Image (no description available)",
          generated: false,
        } as typeof img & { alt: string; generated: boolean });
      }
    }

    return NextResponse.json({
      title: article.title,
      content: article.textContent,
      excerpt: article.excerpt,
      byline: article.byline,
      siteName: article.siteName,
      url: currentUrl,
      images: imagesWithAlt,
    });
  } catch (error) {
    console.error("Extract API error:", error);
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
