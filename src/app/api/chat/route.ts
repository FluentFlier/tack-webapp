import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { createClient } from "@insforge/sdk";
import {
  serperScrapeContext,
  serperSearchContext,
} from "@/lib/serper";

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await auth();
    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowed } = checkRateLimit(userId, 20, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const { message, conversation_id } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const sanitizedMessage = message.slice(0, 10000).trim();
    if (!sanitizedMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL!,
      edgeFunctionToken: token,
    });

    let convId = conversation_id;
    if (!convId) {
      const { data: conv, error: convError } = await insforge.database
        .from("conversations")
        .insert({ user_id: userId, title: sanitizedMessage.slice(0, 100) })
        .select()
        .single();

      if (convError || !conv) {
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
      }
      convId = conv.id;
    }

    await insforge.database.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: sanitizedMessage,
      metadata: {},
    });

    const urls = extractUrls(sanitizedMessage);
    const extractions = await Promise.all(urls.map(extractContent));
    const validExtractions = extractions.filter(Boolean) as {
      title: string;
      content: string;
      url: string;
    }[];

    let contextBlock = "";
    const sources: { title: string; url: string }[] = [];
    if (validExtractions.length > 0) {
      contextBlock = "\n\n--- EXTRACTED WEB CONTENT ---\n";
      for (const ext of validExtractions) {
        contextBlock += `\nSource: ${ext.title} (${ext.url})\n${ext.content}\n---\n`;
        sources.push({ title: ext.title, url: ext.url });
      }
      contextBlock += "\n--- END EXTRACTED CONTENT ---\n";
    }

    const systemPrompt = `You are Tack, an AI assistant designed to help blind and visually impaired users access the internet.

FORMATTING RULES (follow these strictly):
- Do NOT use markdown syntax. No # for headings, no * or ** for bold, no [text](url) link syntax.
- For section headings, write them on their own line followed by a blank line. Use ALL CAPS or Title Case for headings — do NOT prefix with # symbols.
- For emphasis, simply write the text clearly — do NOT wrap with asterisks or underscores.
- For links, write the full URL on its own (e.g. https://example.com) — do NOT use [Link] or [text](url) format.
- Use numbered lists (1. 2. 3.) and dashes (- ) for bullet points.
- Do NOT include a "Key Takeaways", "Takeaways", or "Summary Takeaways" section at the end of your responses.
- Keep responses concise but thorough.

CONTENT RULES:
- Use plain language, avoiding visual references like "as you can see" or "the blue button".
- When describing web content, focus on the information hierarchy and meaning.
- When summarizing web pages, provide a structured breakdown with sections and key points.
- When reading and simplifying web pages, present the main content in plain language, removing navigation, ads, and boilerplate.`;

    // ---------------------------------------------------------------
    // Detect /summarize and /read commands
    // ---------------------------------------------------------------
    const summarizeMatch = message.match(
      /^Please summarize the content at this URL:\s*(.+)$/i
    );
    const readMatch = message.match(
      /^Please read and simplify the content at this URL:\s*(.+)$/i
    );

    let aiUserMessage = message;
    let metadataPayload: Record<string, unknown> = {};
    let serperCitations: Array<{ title: string; url: string }> = [];

    // ---------------------------------------------------------------
    // /summarize — Scrape the page via Serper, then ask AI to summarize
    // ---------------------------------------------------------------
    if (summarizeMatch) {
      const url = summarizeMatch[1].trim();
      metadataPayload.source_url = url;
      metadataPayload.command = "summarize";

      try {
        // 1. Scrape the page content via Serper
        const { content, title } = await serperScrapeContext(url);

        // 2. Also do a quick search for context about the page
        let searchContext = "";
        try {
          searchContext = await serperSearchContext(
            `site:${new URL(url).hostname} ${title || url}`,
            3
          );
        } catch {
          // Search context is optional — don't fail if it errors
        }

        aiUserMessage = `Summarize the following web page content. Provide a clear, structured summary with key points, organized with headings and numbered lists where appropriate.

Page URL: ${url}
${title ? `Page Title: ${title}` : ""}

--- BEGIN PAGE CONTENT ---
${content}
--- END PAGE CONTENT ---
${searchContext ? `\n--- ADDITIONAL CONTEXT FROM SEARCH ---\n${searchContext}\n--- END CONTEXT ---` : ""}`;

        serperCitations.push({ title: title || url, url });
      } catch (scrapeError) {
        console.warn("Serper scrape failed, falling back to search:", scrapeError);

        // Fallback: use Serper search to get context about the URL
        try {
          const searchContext = await serperSearchContext(url, 5);
          aiUserMessage = `I could not directly access the page at ${url}, but here is what Google search says about it. Please provide a summary based on this information.

--- SEARCH RESULTS ---
${searchContext}
--- END SEARCH RESULTS ---`;
        } catch {
          aiUserMessage = `Please summarize what you know about the following URL: ${url}. Note: I was unable to fetch the page content.`;
        }
      }
    }

    // ---------------------------------------------------------------
    // /read — Scrape the page via Serper, then ask AI to simplify
    // ---------------------------------------------------------------
    else if (readMatch) {
      const url = readMatch[1].trim();
      metadataPayload.source_url = url;
      metadataPayload.command = "read";

      try {
        // Scrape the page content via Serper
        const { content, title } = await serperScrapeContext(url, 20000);

        aiUserMessage = `Read and simplify the following web page content. Present the main content in a clear, accessible format using plain language. Break it into logical sections with headings. Remove any navigation, ads, or boilerplate — focus only on the useful content.

Page URL: ${url}
${title ? `Page Title: ${title}` : ""}

--- BEGIN PAGE CONTENT ---
${content}
--- END PAGE CONTENT ---`;

        serperCitations.push({ title: title || url, url });
      } catch (scrapeError) {
        console.warn("Serper scrape failed, falling back to search:", scrapeError);

        // Fallback: use Serper search
        try {
          const searchContext = await serperSearchContext(url, 5);
          aiUserMessage = `I could not directly access the page at ${url}, but here is what Google search says about it. Please present the information in a clear, simplified format.

--- SEARCH RESULTS ---
${searchContext}
--- END SEARCH RESULTS ---`;
        } catch {
          aiUserMessage = `Please describe what you know about the following URL: ${url}. Note: I was unable to fetch the page content.`;
        }
      }
    }

    // ---------------------------------------------------------------
    // /search — Search Google via Serper, then ask AI to present results
    // ---------------------------------------------------------------
    else {
      const searchMatch = message.match(
        /^Please search the web for:\s*(.+)$/i
      );

      if (searchMatch) {
        const query = searchMatch[1].trim();
        metadataPayload.command = "search";

        try {
          const searchContext = await serperSearchContext(query, 8);
          aiUserMessage = `The user asked to search the web for: "${query}". Below are the Google search results from Serper.dev. Please present these results in a clear, accessible format — summarize the key findings, highlight the most relevant results, and provide useful context.

--- SEARCH RESULTS ---
${searchContext}
--- END SEARCH RESULTS ---`;
        } catch (searchError) {
          console.warn("Serper search failed:", searchError);
          aiUserMessage = `Please search for and summarize information about: ${query}. Note: The web search API was unavailable, so please use your existing knowledge.`;
        }
      }
    }

    // ---------------------------------------------------------------
    // Build messages and call InsForge AI
    // ---------------------------------------------------------------
    const messagesToSend = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: aiUserMessage },
    ];

    const completion = await insforge.ai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: messagesToSend,
    });

    const assistantContent =
      completion.choices[0]?.message?.content ||
      "I'm sorry, I couldn't generate a response.";

    // Merge any Serper citations into metadata
    if (serperCitations.length > 0) {
      metadataPayload.citations = serperCitations;
    }

    // Save assistant message
    const { data: savedMessage, error: msgError } = await insforge.database
      .from("messages")
      .insert({
        conversation_id: convId,
        role: "assistant",
        content: assistantContent,
        metadata: metadataPayload,
      })
      .select()
      .single();

    if (msgError) {
      return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
    }

    await insforge.database
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convId);

    return NextResponse.json({ message: savedMessage, conversation_id: convId });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
