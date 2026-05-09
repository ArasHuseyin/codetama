/**
 * Square-spiral coordinate mapping. Index 0 → (0,0), then walks outward in a
 * counter-clockwise spiral. Each "ring" k contains 8k cells.
 *
 *   16 15 14 13 12
 *   17  4  3  2 11
 *   18  5  0  1 10
 *   19  6  7  8  9
 *   20 21 22 23 24
 */
export function spiralIndexToXY(n: number): { x: number; y: number } {
  if (n === 0) return { x: 0, y: 0 };
  const k = Math.ceil((Math.sqrt(n) - 1) / 2);
  const ringSide = 2 * k + 1;
  const ringMaxIndex = ringSide * ringSide - 1;
  const ringMinIndex = ringMaxIndex - 8 * k + 1;
  const offsetInRing = n - ringMinIndex;
  const sideLen = 2 * k;

  if (offsetInRing < sideLen) return point(k, -k + 1 + offsetInRing);
  if (offsetInRing < 2 * sideLen) return point(k - 1 - (offsetInRing - sideLen), k);
  if (offsetInRing < 3 * sideLen) return point(-k, k - 1 - (offsetInRing - 2 * sideLen));
  return point(-k + 1 + (offsetInRing - 3 * sideLen), -k);
}

function point(x: number, y: number): { x: number; y: number } {
  return {
    x: Object.is(x, -0) ? 0 : x,
    y: Object.is(y, -0) ? 0 : y,
  };
}

export async function findNextFreeSpawn(
  isOccupied: (x: number, y: number) => Promise<boolean>,
  startIndex: number = 0,
  maxScan: number = 10_000,
): Promise<{ x: number; y: number; index: number }> {
  for (let i = startIndex; i < startIndex + maxScan; i++) {
    const { x, y } = spiralIndexToXY(i);
    if (!(await isOccupied(x, y))) return { x, y, index: i };
  }
  throw new Error(`Could not find free spawn within ${maxScan} positions of index ${startIndex}`);
}
