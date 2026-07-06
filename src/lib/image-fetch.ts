/** Maximum image size accepted by the alt-text pipeline (4 MiB). */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export interface FetchImageResult {
  /** `data:<mime>;base64,...` string ready for an image_url content part. */
  dataUrl: string;
  mimeType: string;
}

/**
 * Thrown when an image cannot be fetched or does not pass safety checks.
 * Callers should catch this and emit an honest fallback rather than guessing.
 */
export class ImageFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageFetchError";
  }
}

/**
 * Fetches a public image URL and returns it as a base64 data URL.
 *
 * Safety constraints (any violation throws ImageFetchError):
 * - Redirects are rejected (redirect: "manual")
 * - Content-Type must be one of the raster types in ALLOWED_MIME_TYPES
 *   (SVG is excluded: XML, not pixels — vision models cannot read it)
 * - Body size is capped at MAX_IMAGE_BYTES (checked via Content-Length header
 *   and enforced while streaming the body)
 * - 10-second AbortSignal timeout
 *
 * The caller is responsible for running assertPublicUrl() on the URL before
 * passing it here (SSRF guard).
 */
export async function fetchImageAsDataUrl(
  absoluteUrl: string
): Promise<FetchImageResult> {
  let response: Response;
  try {
    response = await fetch(absoluteUrl, {
      headers: { "User-Agent": "Tack/1.0 (Accessibility Assistant)" },
      signal: AbortSignal.timeout(10000),
      redirect: "manual",
    });
  } catch (err) {
    throw new ImageFetchError(
      `Image fetch failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (response.status >= 300 && response.status < 400) {
    throw new ImageFetchError("Image URL redirected; redirects are not followed");
  }

  if (!response.ok) {
    throw new ImageFetchError(`Image fetch returned HTTP ${response.status}`);
  }

  const rawContentType = response.headers.get("Content-Type") ?? "";
  const mimeType = rawContentType.split(";")[0].trim().toLowerCase();
  const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
  ] as const;
  if (!ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new ImageFetchError(
      `Unsupported image content-type "${mimeType || "(none)"}". Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  // Fast-fail on Content-Length when server supplies it
  const clHeader = response.headers.get("Content-Length");
  if (clHeader !== null) {
    const cl = parseInt(clHeader, 10);
    if (!isNaN(cl) && cl > MAX_IMAGE_BYTES) {
      throw new ImageFetchError(
        `Image too large: Content-Length ${cl} exceeds ${MAX_IMAGE_BYTES} byte limit`
      );
    }
  }

  // Stream body with running size guard
  const reader = response.body?.getReader();
  if (!reader) {
    throw new ImageFetchError("Response body is not readable");
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > MAX_IMAGE_BYTES) {
          reader.cancel().catch(() => undefined);
          throw new ImageFetchError(
            `Image body exceeds ${MAX_IMAGE_BYTES} byte limit`
          );
        }
        chunks.push(value);
      }
    }
  } catch (err) {
    if (err instanceof ImageFetchError) throw err;
    throw new ImageFetchError(
      `Error reading image body: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const buffer = Buffer.concat(chunks);
  const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
  return { dataUrl, mimeType };
}
