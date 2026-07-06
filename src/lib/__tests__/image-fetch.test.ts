import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchImageAsDataUrl,
  ImageFetchError,
  MAX_IMAGE_BYTES,
} from "../image-fetch";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal ReadableStream from a Uint8Array. */
function makeStream(data: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    },
  });
}

/** Build a mock Response with sane defaults. */
function mockResponse(opts: {
  status?: number;
  contentType?: string;
  contentLength?: number | null;
  body?: Uint8Array | null;
}): Response {
  const {
    status = 200,
    contentType = "image/png",
    contentLength = null,
    body = new Uint8Array([1, 2, 3]),
  } = opts;

  const headers = new Headers();
  if (contentType) headers.set("Content-Type", contentType);
  if (contentLength !== null)
    headers.set("Content-Length", String(contentLength));

  return {
    ok: status >= 200 && status < 300,
    status,
    headers,
    body: body !== null ? makeStream(body) : null,
  } as unknown as Response;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("fetchImageAsDataUrl", () => {
  const mockFetch = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── Happy path ──────────────────────────────────────────────────────────

  it("returns a base64 data URL for a valid image", async () => {
    const imageBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG magic
    mockFetch.mockResolvedValueOnce(
      mockResponse({ contentType: "image/png", body: imageBytes })
    );

    const result = await fetchImageAsDataUrl("https://example.com/img.png");

    expect(result.mimeType).toBe("image/png");
    expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
    const b64 = result.dataUrl.replace("data:image/png;base64,", "");
    expect(Buffer.from(b64, "base64")).toEqual(Buffer.from(imageBytes));
  });

  it("strips charset from content-type when building the data URL", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        contentType: "image/jpeg; charset=utf-8",
        body: new Uint8Array([0xff, 0xd8]),
      })
    );

    const result = await fetchImageAsDataUrl("https://example.com/img.jpg");
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.dataUrl).toMatch(/^data:image\/jpeg;base64,/);
  });

  // ── Redirect rejection ──────────────────────────────────────────────────

  it.each([301, 302, 307, 308])(
    "rejects HTTP %i redirect",
    async (status) => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ status, contentType: "", body: null })
      );

      await expect(
        fetchImageAsDataUrl("https://example.com/img.png")
      ).rejects.toThrow(ImageFetchError);
    }
  );

  // ── Non-OK status ───────────────────────────────────────────────────────

  it("rejects non-OK HTTP status", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ status: 404, contentType: "text/html", body: null })
    );

    await expect(
      fetchImageAsDataUrl("https://example.com/missing.png")
    ).rejects.toThrow(ImageFetchError);
  });

  // ── Redirect: fetch called with redirect: "manual" ──────────────────────

  it.each([301, 302, 307, 308])(
    "calls fetch with redirect: manual on HTTP %i",
    async (status) => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ status, contentType: "", body: null })
      );

      await expect(
        fetchImageAsDataUrl("https://example.com/img.png")
      ).rejects.toThrow(ImageFetchError);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/img.png",
        expect.objectContaining({ redirect: "manual" })
      );
    }
  );

  // ── 200 with null body (no reader) ──────────────────────────────────────

  it("rejects a 200 response whose body is null", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ status: 200, contentType: "image/png", body: null })
    );

    await expect(
      fetchImageAsDataUrl("https://example.com/img.png")
    ).rejects.toThrow(ImageFetchError);
  });

  // ── Content-Type allowlist ───────────────────────────────────────────────

  it("rejects image/svg+xml (not a raster format; vision model cannot process)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ contentType: "image/svg+xml" })
    );

    await expect(
      fetchImageAsDataUrl("https://example.com/icon.svg")
    ).rejects.toThrow(ImageFetchError);
  });

  it("accepts image/avif", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        contentType: "image/avif",
        body: new Uint8Array([0x00, 0x00, 0x00]),
      })
    );

    const result = await fetchImageAsDataUrl("https://example.com/photo.avif");
    expect(result.mimeType).toBe("image/avif");
    expect(result.dataUrl).toMatch(/^data:image\/avif;base64,/);
  });

  it("rejects text/html content-type", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ contentType: "text/html" })
    );

    await expect(
      fetchImageAsDataUrl("https://example.com/page.html")
    ).rejects.toThrow(ImageFetchError);
  });

  it("rejects application/json content-type", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ contentType: "application/json" })
    );

    await expect(
      fetchImageAsDataUrl("https://example.com/data.json")
    ).rejects.toThrow(ImageFetchError);
  });

  it("rejects empty content-type", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ contentType: "" })
    );

    await expect(
      fetchImageAsDataUrl("https://example.com/unknown")
    ).rejects.toThrow(ImageFetchError);
  });

  // ── Content-Length size cap ─────────────────────────────────────────────

  it("rejects when Content-Length header exceeds 4 MB", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        contentLength: MAX_IMAGE_BYTES + 1,
        body: new Uint8Array(10), // body itself is small — header check fires first
      })
    );

    await expect(
      fetchImageAsDataUrl("https://example.com/huge.png")
    ).rejects.toThrow(ImageFetchError);
  });

  it("accepts when Content-Length is exactly at the limit", async () => {
    // Just verify no error is thrown for a response at exactly the limit in the header.
    // Body is tiny — only header triggers the fast-fail path.
    const body = new Uint8Array(8);
    mockFetch.mockResolvedValueOnce(
      mockResponse({ contentLength: MAX_IMAGE_BYTES, body })
    );

    await expect(
      fetchImageAsDataUrl("https://example.com/edge.png")
    ).resolves.toBeDefined();
  });

  // ── Body size cap ───────────────────────────────────────────────────────

  it("rejects when streamed body exceeds 4 MB (no Content-Length)", async () => {
    // Create a stream that yields MAX_IMAGE_BYTES + 1 bytes in two chunks.
    const chunk1 = new Uint8Array(MAX_IMAGE_BYTES); // exactly at limit
    const chunk2 = new Uint8Array(1); // pushes it over
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(chunk1);
        controller.enqueue(chunk2);
        controller.close();
      },
    });

    const headers = new Headers({ "Content-Type": "image/png" });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers,
      body: stream,
    } as unknown as Response);

    await expect(
      fetchImageAsDataUrl("https://example.com/toobig.png")
    ).rejects.toThrow(ImageFetchError);
  });

  it("accepts a body exactly at the 4 MB limit", async () => {
    const body = new Uint8Array(MAX_IMAGE_BYTES);
    mockFetch.mockResolvedValueOnce(
      mockResponse({ contentLength: null, body })
    );

    await expect(
      fetchImageAsDataUrl("https://example.com/maxsize.png")
    ).resolves.toBeDefined();
  });

  // ── Fetch error ─────────────────────────────────────────────────────────

  it("wraps a network error as ImageFetchError", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(
      fetchImageAsDataUrl("https://example.com/img.png")
    ).rejects.toThrow(ImageFetchError);
  });

  // ── URL resolution (pure logic, no fetch needed) ────────────────────────

  it("relative-to-absolute URL resolution works correctly", () => {
    // This is pure URL API logic used in the route; test it here as a sanity check.
    expect(
      new URL("/images/hero.jpg", "https://example.com/page").href
    ).toBe("https://example.com/images/hero.jpg");

    expect(
      new URL("img/photo.jpg", "https://example.com/blog/post/").href
    ).toBe("https://example.com/blog/post/img/photo.jpg");

    expect(
      new URL("https://cdn.example.com/img.png", "https://example.com/").href
    ).toBe("https://cdn.example.com/img.png");
  });
});
