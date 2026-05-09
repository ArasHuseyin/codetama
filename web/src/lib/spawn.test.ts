import { describe, it, expect } from "vitest";
import { findNextFreeSpawn, spiralIndexToXY } from "./spawn";

describe("spiralIndexToXY", () => {
  it("starts at origin", () => {
    expect(spiralIndexToXY(0)).toEqual({ x: 0, y: 0 });
  });

  it("goes right first (index 1)", () => {
    expect(spiralIndexToXY(1)).toEqual({ x: 1, y: 0 });
  });

  it("walks the first ring counter-clockwise", () => {
    expect(spiralIndexToXY(2)).toEqual({ x: 1, y: 1 });
    expect(spiralIndexToXY(3)).toEqual({ x: 0, y: 1 });
    expect(spiralIndexToXY(4)).toEqual({ x: -1, y: 1 });
    expect(spiralIndexToXY(5)).toEqual({ x: -1, y: 0 });
    expect(spiralIndexToXY(6)).toEqual({ x: -1, y: -1 });
    expect(spiralIndexToXY(7)).toEqual({ x: 0, y: -1 });
    expect(spiralIndexToXY(8)).toEqual({ x: 1, y: -1 });
  });

  it("first ring 8 cells produce all unique coords with origin", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 9; i++) {
      const { x, y } = spiralIndexToXY(i);
      seen.add(`${x},${y}`);
    }
    expect(seen.size).toBe(9);
  });

  it("100 indices are all unique", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const { x, y } = spiralIndexToXY(i);
      seen.add(`${x},${y}`);
    }
    expect(seen.size).toBe(100);
  });
});

describe("findNextFreeSpawn", () => {
  it("returns first unoccupied position", async () => {
    const occupied = new Set(["0,0", "1,0"]);
    const result = await findNextFreeSpawn(async (x, y) => occupied.has(`${x},${y}`), 0);
    expect(result).toEqual({ x: 1, y: 1, index: 2 });
  });

  it("starts from given index", async () => {
    const result = await findNextFreeSpawn(async () => false, 5);
    expect(result.index).toBe(5);
    expect(result).toEqual({ x: -1, y: 0, index: 5 });
  });

  it("throws after maxScan exceeded", async () => {
    await expect(findNextFreeSpawn(async () => true, 0, 10)).rejects.toThrow();
  });
});
