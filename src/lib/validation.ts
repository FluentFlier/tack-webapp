import dns from "dns";
import net from "net";
import { z } from "zod";

// ── SSRF Guard ────────────────────────────────────────────────────────────────

function isPrivateIpv4(addr: string): boolean {
  const parts = addr.split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some((p) => isNaN(p) || p < 0 || p > 255)
  ) {
    return false;
  }
  const [a, b] = parts;

  if (a === 0 && parts[1] === 0 && parts[2] === 0 && parts[3] === 0)
    return true; // 0.0.0.0 unspecified
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 10) return true; // 10.0.0.0/8 private
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 private
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 private
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local

  return false;
}

function isPrivateIpv6(addr: string): boolean {
  // Strip zone ID (e.g. fe80::1%eth0 → fe80::1)
  const a = addr.split("%")[0].toLowerCase().trim();

  if (a === "::" || a === "::0") return true; // unspecified
  if (a === "::1") return true; // loopback

  // IPv4-mapped: ::ffff:x.x.x.x (and ::ffff:0:x.x.x.x IPv4-translated form)
  const ipv4Mapped = a.match(/^::(?:ffff:(?:0:)?)?(\d+\.\d+\.\d+\.\d+)$/);
  if (ipv4Mapped) return isPrivateIpv4(ipv4Mapped[1]);

  // Derive the first 16-bit group for range checks.
  // Addresses starting with "::" have a 0 first group and cannot be in
  // fe80::/10 or fc00::/7 unless they're handled above.
  let firstGroup16 = 0;
  if (!a.startsWith("::")) {
    firstGroup16 = parseInt(a.split(":")[0] || "0", 16);
  }

  // Link-local: fe80::/10 — first group 0xfe80–0xfebf
  if ((firstGroup16 & 0xffc0) === 0xfe80) return true;
  // Unique-local: fc00::/7 — first group 0xfc00–0xfdff
  if ((firstGroup16 & 0xfe00) === 0xfc00) return true;

  return false;
}

function isPrivateAddress(addr: string): boolean {
  // Strip zone ID before net.isIPv6 check (zone IDs fail the regex)
  const clean = addr.includes("%") ? addr.split("%")[0] : addr;
  if (net.isIPv4(clean)) return isPrivateIpv4(clean);
  if (net.isIPv6(clean)) return isPrivateIpv6(clean);
  return false;
}

/**
 * Asserts that a URL is safe to fetch:
 * - Must use http or https protocol
 * - Hostname must not resolve to any private, loopback, link-local,
 *   unique-local, unspecified, or IPv4-mapped private address
 *
 * Literal IP hostnames are checked directly without performing a DNS lookup.
 *
 * @throws {Error} with a descriptive message when the URL is blocked
 */
export async function assertPublicUrl(url: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(
      `Protocol "${parsed.protocol}" is not allowed. Only http and https are supported.`
    );
  }

  // URL.hostname for IPv6 literals includes brackets: [::1] → strip them
  const hostname =
    parsed.hostname.startsWith("[") && parsed.hostname.endsWith("]")
      ? parsed.hostname.slice(1, -1)
      : parsed.hostname;

  let addresses: string[];

  if (net.isIP(hostname) !== 0) {
    // Literal IP address — validate directly without DNS
    addresses = [hostname];
  } else {
    try {
      const records = await dns.promises.lookup(hostname, { all: true });
      addresses = records.map((r) => r.address);
    } catch {
      throw new Error(`Could not resolve hostname: ${hostname}`);
    }

    if (addresses.length === 0) {
      throw new Error(`No addresses resolved for: ${hostname}`);
    }
  }

  for (const addr of addresses) {
    if (isPrivateAddress(addr)) {
      throw new Error(
        `Blocked: "${addr}" resolves to a private or reserved address`
      );
    }
  }

  return parsed;
}

// ── Zod Schemas ───────────────────────────────────────────────────────────────

export const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  conversation_id: z.string().uuid().optional(),
  command: z.enum(["summarize", "read", "search"]).optional(),
  args: z.string().max(2000).optional(),
});

export const shortenSchema = z.object({
  text: z.string().min(1).max(20000),
  percent: z.number().min(5).max(95),
});

export const summarizeSchema = z.object({
  text: z.string().min(1).max(20000),
  targetLength: z.number().min(50).max(2000),
});

export const extractSchema = z.object({
  url: z.string().min(1),
});

// ── Timeout Helper ────────────────────────────────────────────────────────────

/**
 * Races a promise against a timeout. Rejects with an Error when the
 * timeout elapses before the promise settles.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = "Operation"
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms
      )
    ),
  ]);
}
