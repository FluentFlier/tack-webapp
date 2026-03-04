import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";

/* eslint-disable */
const pdfParse = require("pdf-parse");
/* eslint-enable */

function simplifyText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(\w)-\n(\w)/g, "$1$2")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await auth();
    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);

    const simplified = simplifyText(data.text);

    return NextResponse.json({
      text: data.text,
      numPages: data.numpages,
      title: data.info?.Title || file.name.replace(/\.pdf$/i, ""),
      author: data.info?.Author || null,
      simplified,
    });
  } catch (error) {
    console.error("PDF API error:", error);
    return NextResponse.json({ error: "Failed to process PDF" }, { status: 500 });
  }
}
