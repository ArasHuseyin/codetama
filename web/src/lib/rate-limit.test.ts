import { describe, it, expect, beforeEach } from "vitest";
import { checkRate, _resetForTests } from "@/lib/rate-limit";

describe("rate-limit", () => {
  beforeEach(() => _resetForTests());

  it("allows requests within limit", () => {
    const opts = { windowMs: 1000, max: 3 };
    expect(checkRate("a", opts, 1000).ok).toBe(true);
    expect(checkRate("a", opts, 1100).ok).toBe(true);
    expect(checkRate("a", opts, 1200).ok).toBe(true);
  });

  it("blocks once limit hit", () => {
    const opts = { windowMs: 1000, max: 2 };
    checkRate("a", opts, 1000);
    checkRate("a", opts, 1100);
    const r = checkRate("a", opts, 1200);
    expect(r.ok).toBe(false);
    expect(r.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after window expires", () => {
    const opts = { windowMs: 1000, max: 1 };
    checkRate("a", opts, 1000);
    expect(checkRate("a", opts, 1500).ok).toBe(false);
    expect(checkRate("a", opts, 2100).ok).toBe(true);
  });

  it("isolates keys", () => {
    const opts = { windowMs: 1000, max: 1 };
    checkRate("a", opts, 1000);
    expect(checkRate("b", opts, 1100).ok).toBe(true);
  });

  it("decreases remaining count", () => {
    const opts = { windowMs: 1000, max: 5 };
    expect(checkRate("a", opts, 1000).remaining).toBe(4);
    expect(checkRate("a", opts, 1010).remaining).toBe(3);
  });
});
