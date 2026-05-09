import { describe, it, expect } from "vitest";
import { chebyshev, isInRange, CAPTURE_REACH } from "./reachability";

describe("chebyshev distance", () => {
  it("0 for same point", () => {
    expect(chebyshev({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
  });

  it("1 for adjacent (orthogonal)", () => {
    expect(chebyshev({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(1);
  });

  it("1 for adjacent (diagonal) — same as king's move", () => {
    expect(chebyshev({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(1);
  });

  it("2 for two king-steps any direction", () => {
    expect(chebyshev({ x: 0, y: 0 }, { x: 2, y: 2 })).toBe(2);
    expect(chebyshev({ x: 0, y: 0 }, { x: 2, y: 0 })).toBe(2);
    expect(chebyshev({ x: 0, y: 0 }, { x: 1, y: 2 })).toBe(2);
  });

  it("max of |dx| and |dy|", () => {
    expect(chebyshev({ x: 0, y: 0 }, { x: 3, y: 1 })).toBe(3);
    expect(chebyshev({ x: 5, y: 2 }, { x: 1, y: 4 })).toBe(4);
  });
});

describe("isInRange", () => {
  it("true when any owned tile is within reach", () => {
    const owned = [{ x: 0, y: 0 }, { x: 10, y: 10 }];
    expect(isInRange(owned, { x: 11, y: 11 })).toBe(true);
  });

  it("false when no owned tile is within reach", () => {
    expect(isInRange([{ x: 0, y: 0 }], { x: 5, y: 5 })).toBe(false);
  });

  it("at exact boundary (chebyshev = CAPTURE_REACH)", () => {
    expect(isInRange([{ x: 0, y: 0 }], { x: CAPTURE_REACH, y: CAPTURE_REACH })).toBe(true);
  });

  it("just outside boundary", () => {
    expect(isInRange([{ x: 0, y: 0 }], { x: CAPTURE_REACH + 1, y: 0 })).toBe(false);
  });

  it("empty owned tiles → never in range", () => {
    expect(isInRange([], { x: 0, y: 0 })).toBe(false);
  });
});
