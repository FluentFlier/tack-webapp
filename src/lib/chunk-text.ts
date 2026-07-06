// Pure utility for splitting large text into manageable chunks for summarization.
// Tries to split on paragraph boundaries (\n\n) when possible;
// falls back to hard splits when a single paragraph exceeds maxChars.
// Caps output at 10 chunks to bound API usage.

export interface ChunkResult {
  /** The text chunks to summarize individually. Length ≤ 10. */
  chunks: string[];
  /** True when the original text had more than 10 chunks and coverage is partial. */
  truncated: boolean;
  /** Approximate percentage of the original text covered by the returned chunks. */
  coveragePercent: number;
}

/**
 * Split `text` into chunks of at most `maxChars` characters.
 * Splits prefer paragraph boundaries (\n\n).
 * Returns at most 10 chunks; sets `truncated` if the input required more.
 */
export function chunkTextForSummary(text: string, maxChars: number): ChunkResult {
  if (text.length <= maxChars) {
    return { chunks: [text], truncated: false, coveragePercent: 100 };
  }

  const paragraphs = text.split("\n\n");
  const allChunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (!para.trim()) continue;

    const separator = current ? "\n\n" : "";
    const candidate = current + separator + para;

    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      // Flush current accumulator before handling this paragraph
      if (current) {
        allChunks.push(current);
        current = "";
      }

      if (para.length > maxChars) {
        // Hard-split an oversized single paragraph
        let remaining = para;
        while (remaining.length > maxChars) {
          allChunks.push(remaining.slice(0, maxChars));
          remaining = remaining.slice(maxChars);
        }
        current = remaining; // keep the remainder for the next iteration
      } else {
        current = para;
      }
    }
  }

  if (current) allChunks.push(current);

  const truncated = allChunks.length > 10;
  const chunks = truncated ? allChunks.slice(0, 10) : allChunks;

  let coveragePercent = 100;
  if (truncated) {
    const coveredChars = chunks.reduce((acc, c) => acc + c.length, 0);
    coveragePercent = Math.min(99, Math.round((coveredChars / text.length) * 100));
  }

  return { chunks, truncated, coveragePercent };
}
