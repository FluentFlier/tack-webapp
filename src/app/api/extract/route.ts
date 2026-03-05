import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { createClient } from "@insforge/sdk";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { checkRateLimit } from "@/lib/rate-limit";

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

    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Tack/1.0 (Accessibility Assistant)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (${response.status})` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
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
    const images = Array.from(imgElements).map((img) => ({
      src: img.getAttribute("src") || "",
      alt: img.getAttribute("alt") || "",
    })).filter((img) => img.src);

    // Generate alt text for images missing it (limit to 5)
    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL!,
      edgeFunctionToken: token,
    });

    const imagesWithAlt = await Promise.all(
      images.slice(0, 5).map(async (img) => {
        if (img.alt) return img;
        try {
          const completion = await insforge.ai.chat.completions.create({
            model: "openai/gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "Generate concise alt text for this image in under 125 characters. Do not start with 'Image of'. Just output the alt text.",
              },
              {
                role: "user",
                content: `Image URL: ${img.src}\nPage title: ${article.title}`,
              },
            ],
          });
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
      url,
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
