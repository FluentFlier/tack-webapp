import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock is hoisted before imports; the factory captures vi.fn() at hoist time.
vi.mock("dns", () => ({
  default: {
    promises: {
      lookup: vi.fn(),
    },
  },
}));

import dns from "dns";
import { assertPublicUrl } from "../validation";

// Convenience cast so we can call .mockResolvedValue / .mockRejectedValue
const mockLookup = dns.promises.lookup as ReturnType<typeof vi.fn>;

describe("assertPublicUrl", () => {
  beforeEach(() => {
    mockLookup.mockReset();
  });

  // ── Protocol checks ──────────────────────────────────────────────────────

  it("rejects ftp:// protocol", async () => {
    await expect(assertPublicUrl("ftp://example.com/file")).rejects.toThrow(
      /not allowed/i
    );
  });

  it("rejects javascript: protocol", async () => {
    await expect(assertPublicUrl("javascript:alert(1)")).rejects.toThrow();
  });

  it("rejects invalid URLs", async () => {
    await expect(assertPublicUrl("not a url")).rejects.toThrow(/invalid url/i);
  });

  // ── Literal IPv4 — no DNS lookup expected ────────────────────────────────

  it("blocks 127.0.0.1 (IPv4 loopback)", async () => {
    await expect(assertPublicUrl("http://127.0.0.1/path")).rejects.toThrow(
      /blocked/i
    );
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it("blocks 127.0.0.100 (IPv4 loopback range)", async () => {
    await expect(assertPublicUrl("http://127.0.0.100")).rejects.toThrow(
      /blocked/i
    );
  });

  it("blocks 10.0.0.5 (RFC-1918 private)", async () => {
    await expect(assertPublicUrl("http://10.0.0.5")).rejects.toThrow(
      /blocked/i
    );
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it("blocks 172.16.0.1 (RFC-1918 private)", async () => {
    await expect(assertPublicUrl("http://172.16.0.1")).rejects.toThrow(
      /blocked/i
    );
  });

  it("blocks 172.31.255.255 (RFC-1918 upper boundary)", async () => {
    await expect(assertPublicUrl("http://172.31.255.255")).rejects.toThrow(
      /blocked/i
    );
  });

  it("allows 172.32.0.1 (just outside RFC-1918 /12)", async () => {
    mockLookup.mockResolvedValue([{ address: "172.32.0.1", family: 4 }]);
    // 172.32.x.x is NOT private — this is a domain-form so lookup is used
    // But if we pass a literal IP it should also pass
    await expect(assertPublicUrl("http://172.32.0.1")).resolves.toBeDefined();
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it("blocks 192.168.1.1 (RFC-1918 private)", async () => {
    await expect(assertPublicUrl("http://192.168.1.1")).rejects.toThrow(
      /blocked/i
    );
  });

  it("blocks 169.254.169.254 (link-local / cloud metadata)", async () => {
    await expect(
      assertPublicUrl("http://169.254.169.254/latest/meta-data")
    ).rejects.toThrow(/blocked/i);
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it("blocks 0.0.0.0 (unspecified)", async () => {
    await expect(assertPublicUrl("http://0.0.0.0")).rejects.toThrow(/blocked/i);
  });

  // ── Literal IPv6 ─────────────────────────────────────────────────────────

  it("blocks [::1] (IPv6 loopback)", async () => {
    await expect(assertPublicUrl("http://[::1]/")).rejects.toThrow(/blocked/i);
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it("blocks [fe80::1] (link-local IPv6)", async () => {
    await expect(assertPublicUrl("http://[fe80::1]/")).rejects.toThrow(
      /blocked/i
    );
  });

  it("blocks [fc00::1] (unique-local IPv6)", async () => {
    await expect(assertPublicUrl("http://[fc00::1]/")).rejects.toThrow(
      /blocked/i
    );
  });

  it("blocks [fd00::1] (unique-local IPv6)", async () => {
    await expect(assertPublicUrl("http://[fd00::1]/")).rejects.toThrow(
      /blocked/i
    );
  });

  // ── DNS resolution — mocked ───────────────────────────────────────────────

  it("blocks hostname that resolves to a private address (10.x)", async () => {
    mockLookup.mockResolvedValue([{ address: "10.0.0.5", family: 4 }]);
    await expect(
      assertPublicUrl("http://internal.corp.example.com")
    ).rejects.toThrow(/blocked/i);
  });

  it("blocks hostname with mixed public/private addresses (any private wins)", async () => {
    mockLookup.mockResolvedValue([
      { address: "8.8.8.8", family: 4 },
      { address: "192.168.0.1", family: 4 },
    ]);
    await expect(assertPublicUrl("http://mixed.example.com")).rejects.toThrow(
      /blocked/i
    );
  });

  it("blocks hostname that resolves to ::1", async () => {
    mockLookup.mockResolvedValue([{ address: "::1", family: 6 }]);
    await expect(
      assertPublicUrl("http://localhost.example.com")
    ).rejects.toThrow(/blocked/i);
  });

  it("rejects when DNS lookup fails", async () => {
    mockLookup.mockRejectedValue(new Error("ENOTFOUND"));
    await expect(
      assertPublicUrl("http://does-not-exist.example.com")
    ).rejects.toThrow(/Could not resolve/i);
  });

  // ── Allowed cases ─────────────────────────────────────────────────────────

  it("allows a public hostname that resolves to a public IP", async () => {
    mockLookup.mockResolvedValue([{ address: "142.250.80.46", family: 4 }]);
    const result = await assertPublicUrl("https://google.com");
    expect(result.hostname).toBe("google.com");
  });

  it("returns the parsed URL on success", async () => {
    mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    const url = await assertPublicUrl("https://example.com/path?q=1");
    expect(url.pathname).toBe("/path");
    expect(url.searchParams.get("q")).toBe("1");
  });
});
