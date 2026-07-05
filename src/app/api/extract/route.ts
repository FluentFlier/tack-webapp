import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { createClient } from "@insforge/sdk";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { checkRateLimit } from "@/lib/rate-limit";
import { extractSchema, assertPublicUrl, withTimeout } from "@/lib/validation";

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

    // Generate alt text for images missing it (limit to 5)
    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL!,
      edgeFunctionToken: token,
    });

    const imagesWithAlt = await Promise.all(
      images.slice(0, 5).map(async (img) => {
        if (img.alt) return img;
        try {
          const completion = await withTimeout(
            insforge.ai.chat.completions.create({
              model: "openai/gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content:
                    "Generate concise alt text for this image in under 125 characters. Do not start with 'Image of'. Just output the alt text.",
                },
                {
                  role: "user",
                  content: `Image URL: ${img.src}\nPage title: ${article.title}`,
                },
              ],
            }),
            60000,
            "Alt text completion"
          );
          return {
            ...img,
            alt: completion.choices[0]?.message?.content || "Image",
            generated: true,
          };
        } catch {
          return { ...img, alt: "Image", generated: true };
        }
      })
    );

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
