"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface MapTile {
  x: number;
  y: number;
  acquiredAt: string;
  owner: { id: string; name: string | null; image: string | null };
  creature: {
    id: string;
    name: string;
    stage: string;
    klass: string | null;
    level: number;
    stats: { str: number | null; int: number | null; dex: number | null };
    hunger: number;
  } | null;
}

interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const TILE = 56;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.2;
const KLASS_COLOR: Record<string, string> = {
  warrior: "#ff7b72",
  warlord: "#ffa198",
  sage: "#79c0ff",
  archmage: "#a5d6ff",
  trickster: "#7ee787",
  shadow: "#56d364",
  balanced: "#d2a8ff",
  druid: "#e2c5ff",
};

export function MapView() {
  const [tiles, setTiles] = useState<MapTile[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<MapTile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    captured: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });

  const cell = TILE * zoom;
  const cx = size.w / 2 + pan.x;
  const cy = size.h / 2 + pan.y;

  const bbox = useMemo<BBox>(() => {
    return {
      minX: Math.floor((0 - cx) / cell) - 1,
      maxX: Math.ceil((size.w - cx) / cell) + 1,
      minY: Math.floor((cy - size.h) / cell) - 1,
      maxY: Math.ceil(cy / cell) + 1,
    };
  }, [cell, cx, cy, size.h, size.w]);

  const bboxKey = `${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY}`;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/map?bbox=${bboxKey}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`map request failed: ${r.status}`);
        return r.json();
      })
      .then((d: { tiles: MapTile[] }) => {
        setTiles(d.tiles);
        setSelected((current) =>
          current ? d.tiles.find((tile) => tile.x === current.x && tile.y === current.y) ?? current : null,
        );
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") {
          setTiles([]);
          setError("map unavailable");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [bboxKey]);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const zoomAt = useCallback(
    (nextZoom: number, clientX?: number, clientY?: number) => {
      const clamped = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      const rect = containerRef.current?.getBoundingClientRect();
      const focusX = rect && clientX !== undefined ? clientX - rect.left : size.w / 2;
      const focusY = rect && clientY !== undefined ? clientY - rect.top : size.h / 2;
      const worldX = (focusX - cx) / cell;
      const worldY = (focusY - cy) / cell;

      setZoom(clamped);
      setPan({
        x: focusX - worldX * TILE * clamped - size.w / 2,
        y: focusY - worldY * TILE * clamped - size.h / 2,
      });
    },
    [cell, cx, cy, size.h, size.w],
  );

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    suppressClick.current = false;
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      captured: false,
    };
    // Don't capture pointer yet — only when we detect actual drag movement.
    // Capturing on pointerdown steals click events from child <g> tile
    // elements, breaking tile selection.
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    if (!drag.current.captured && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      suppressClick.current = true;
      drag.current.captured = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (drag.current.captured) {
      setPan({
        x: drag.current.startPanX + dx,
        y: drag.current.startPanY + dy,
      });
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId === e.pointerId) {
      const wasCapturing = drag.current.captured;
      drag.current = null;
      if (wasCapturing && e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  }

  function onWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.88;
    zoomAt(zoom * factor, e.clientX, e.clientY);
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none bg-bgPanel/60"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onClick={() => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          setSelected(null);
        }}
      >
        <svg width={size.w} height={size.h} className="block">
          <defs>
            <pattern
              id="grid"
              width={cell}
              height={cell}
              patternUnits="userSpaceOnUse"
              x={(((cx - cell / 2) % cell) + cell) % cell}
              y={(((cy - cell / 2) % cell) + cell) % cell}
            >
              <path d={`M ${cell} 0 L 0 0 0 ${cell}`} fill="none" stroke="#1a3018" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {tiles.map((t) => {
            const px = cx + t.x * cell - cell / 2;
            const py = cy - t.y * cell - cell / 2;
            const klass = t.creature?.klass ?? "balanced";
            const color = KLASS_COLOR[klass] ?? "#7ee787";
            const isSelected = selected?.x === t.x && selected?.y === t.y;
            return (
              <g
                key={`${t.x}_${t.y}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  setSelected(t);
                }}
                className="cursor-pointer"
              >
                <rect
                  x={px}
                  y={py}
                  width={cell - 2}
                  height={cell - 2}
                  fill={color}
                  fillOpacity={0.18}
                  stroke={color}
                  strokeWidth={isSelected ? 3 : 1}
                />
                <text
                  x={px + cell / 2}
                  y={py + Math.max(14, cell * 0.28)}
                  textAnchor="middle"
                  fill={color}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize={Math.max(8, Math.min(11, cell * 0.18))}
                >
                  {(t.owner.name ?? "anon").slice(0, 8)}
                </text>
                {t.creature && (
                  <>
                    <text
                      x={px + cell / 2}
                      y={py + cell / 2 + 4}
                      textAnchor="middle"
                      fill={color}
                      fontFamily="JetBrains Mono, monospace"
                      fontSize={Math.max(9, Math.min(13, cell * 0.2))}
                      fontWeight="bold"
                    >
                      LV {t.creature.level}
                    </text>
                    <text
                      x={px + cell / 2}
                      y={py + cell - Math.max(7, cell * 0.15)}
                      textAnchor="middle"
                      fill={color}
                      fontFamily="JetBrains Mono, monospace"
                      fontSize={Math.max(8, Math.min(10, cell * 0.16))}
                      opacity="0.8"
                    >
                      {t.creature.stage}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          <circle cx={cx} cy={cy} r="2" fill="#3fb950" opacity="0.5" />
        </svg>

        <div className="absolute bottom-14 left-2 dim text-xs">
          ({-Math.round(pan.x / cell)}, {Math.round(pan.y / cell)}) / {Math.round(zoom * 100)}% / {tiles.length} bases
          {loading ? " / loading" : ""}
          {error ? ` / ${error}` : ""}
        </div>
        <div className="absolute top-20 left-3 border border-fgMuted bg-bgPanel/90 px-3 py-2">
          <p className="text-sm text-fg">world map</p>
          <p className="dim text-xs">drag / scroll / click base</p>
        </div>
        <div className="absolute top-20 right-2 flex border border-fgMuted bg-bgPanel/90">
          <button
            className="px-3 py-1 text-sm text-fg hover:bg-fg hover:text-bg"
            onClick={(e) => {
              e.stopPropagation();
              zoomAt(zoom / 1.2);
            }}
          >
            -
          </button>
          <button
            className="px-3 py-1 text-sm text-fg hover:bg-fg hover:text-bg"
            onClick={(e) => {
              e.stopPropagation();
              zoomAt(zoom * 1.2);
            }}
          >
            +
          </button>
        </div>
        <TileDetail tile={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
}

function TileDetail({ tile, onClose }: { tile: MapTile | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!tile) return null;

  async function challenge() {
    if (!tile) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/battle/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ defenderUserId: tile.owner.id, tileX: tile.x, tileY: tile.y }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      const data = (await res.json()) as { battleId: string };
      window.location.href = `/battle/${data.battleId}`;
    } catch {
      setError("network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside
      className="absolute right-3 top-32 w-[min(320px,calc(100vw-24px))] border border-fgMuted bg-bgPanel/95 p-5 space-y-3 shadow-lg"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button onClick={onClose} className="absolute top-2 right-3 muted hover:text-fg text-sm" aria-label="Close">
        x
      </button>
      <p className="dim text-xs">
        tile ({tile.x}, {tile.y})
      </p>
      <h3 className="text-lg">{tile.owner.name ?? "anonymous"}</h3>
      {tile.creature ? (
        <>
          <div className="text-sm dim">
            <span className="text-fg">{tile.creature.name}</span> [{tile.creature.klass ?? "-"} / {tile.creature.stage}]
          </div>
          <ul className="text-xs dim space-y-1">
            <li>
              level: <span className="text-fg">{tile.creature.level}</span>
            </li>
            <li>
              STR {tile.creature.stats.str ?? 1} / INT {tile.creature.stats.int ?? 1} / DEX{" "}
              {tile.creature.stats.dex ?? 1}
            </li>
            <li>hunger: {tile.creature.hunger ?? 0} / 100</li>
          </ul>
        </>
      ) : (
        <p className="dim text-sm">this base has no active creature.</p>
      )}
      {error && <p className="text-accent text-xs">{error}</p>}
      <button
        onClick={challenge}
        disabled={busy || !tile.creature}
        className={`btn w-full ${!tile.creature ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        {busy ? "starting…" : "⚔ challenge"}
      </button>
    </aside>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
