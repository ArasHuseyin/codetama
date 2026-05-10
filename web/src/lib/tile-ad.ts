/**
 * Helpers for the tile-ad feature: validation + URL whitelist.
 */

export const MAX_TEXT_LEN = 80;
export const MAX_URL_LEN = 200;

const ALLOWED_TLDS = new Set([
  "dev", "io", "app", "com", "xyz", "org", "net",
  "tech", "codes", "studio", "page", "site", "dev",
  "ai", "co", "fyi", "cloud",
]);

const ALLOWED_HOSTS = new Set([
  "github.com",
  "gitlab.com",
  "codeberg.org",
  "sourcehut.org",
  "twitter.com",
  "x.com",
  "bsky.app",
  "mastodon.social",
  "linkedin.com",
  "youtube.com",
  "youtu.be",
  "codetama.com",
]);

const BLOCKED_HOSTS = [
  /\.casino$/,
  /\.bet$/,
  /\.poker$/,
  /\.adult$/,
  /\.xxx$/,
  /\bporn\b/,
];

const PROFANITY = [
  // Light filter — covers obvious slurs. Manual review catches the rest.
  /\bn[i1]gg/i, /\bf[a4]gg/i, /\br[e3]t[a4]rd/i, /\bcunt\b/i,
];

export interface ValidationResult {
  ok: boolean;
  text: string | null;
  url: string | null;
  needsReview: boolean;
  reason?: string;
}

export function validateTileAd(rawText: string | null, rawUrl: string | null): ValidationResult {
  const text = rawText?.trim() || null;
  const url = rawUrl?.trim() || null;

  if (!text && !url) {
    return { ok: false, text: null, url: null, needsReview: false, reason: "either text or url is required" };
  }

  if (text && text.length > MAX_TEXT_LEN) {
    return { ok: false, text, url, needsReview: false, reason: `text too long (max ${MAX_TEXT_LEN} chars)` };
  }
  if (url && url.length > MAX_URL_LEN) {
    return { ok: false, text, url, needsReview: false, reason: `url too long (max ${MAX_URL_LEN} chars)` };
  }

  if (text) {
    for (const re of PROFANITY) {
      if (re.test(text)) {
        return { ok: false, text, url, needsReview: false, reason: "text contains disallowed words" };
      }
    }
  }

  let needsReview = false;
  if (url) {
    let parsed: URL;
    try {
      parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return { ok: false, text, url, needsReview: false, reason: "invalid url" };
    }

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, text, url, needsReview: false, reason: "url must be http or https" };
    }

    const host = parsed.hostname.toLowerCase();

    for (const re of BLOCKED_HOSTS) {
      if (re.test(host)) {
        return { ok: false, text, url, needsReview: false, reason: "url domain is blocked" };
      }
    }

    const tld = host.split(".").pop() ?? "";
    const inAllowedHost = ALLOWED_HOSTS.has(host) || [...ALLOWED_HOSTS].some((h) => host.endsWith(`.${h}`));
    const inAllowedTld = ALLOWED_TLDS.has(tld);

    if (!inAllowedHost && !inAllowedTld) {
      // Unusual TLD — flag for manual review rather than reject outright.
      needsReview = true;
    }
  }

  return { ok: true, text, url, needsReview };
}
