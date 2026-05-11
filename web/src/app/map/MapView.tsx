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
  ad: {
    text: string | null;
    url: string | null;
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
const REACH = 2;

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

export function MapView({ viewerId }: { viewerId: string | null }) {
  const [tiles, setTiles] = useState<MapTile[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<MapTile | null>(null);
  const [hovered, setHovered] = useState<{ tile: MapTile; cx: number; cy: number } | null>(null);
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

  // Owner lookup for connected-territory edge calculation.
  const ownerByCoord = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of tiles) m.set(`${t.x},${t.y}`, t.owner.id);
    return m;
  }, [tiles]);

  // My tiles + reachability set when viewer's own tile is selected.
  const myTiles = useMemo(
    () => tiles.filter((t) => viewerId && t.owner.id === viewerId),
    [tiles, viewerId],
  );

  // Always compute the set of attackable coords from the viewer's tiles.
  // This is used for the canChallenge button check and for highlighting.
  const attackableSet = useMemo(() => {
    if (!viewerId) return null;
    const set = new Set<string>();
    for (const own of myTiles) {
      for (let dx = -REACH; dx <= REACH; dx++) {
        for (let dy = -REACH; dy <= REACH; dy++) {
          if (dx === 0 && dy === 0) continue;
          set.add(`${own.x + dx},${own.y + dy}`);
        }
      }
    }
    for (const own of myTiles) set.delete(`${own.x},${own.y}`);
    return set;
  }, [viewerId, myTiles]);

  // The ring overlay only renders when the viewer has selected one of
  // their own tiles — selecting an enemy shouldn't paint rings.
  const showReachRings =
    !!viewerId && !!selected && selected.owner.id === viewerId && !!attackableSet;

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

  const recenter = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const goToMyTile = useCallback(() => {
    if (myTiles.length === 0) return;
    const t = myTiles[0]!;
    setPan({ x: -t.x * TILE * zoom, y: t.y * TILE * zoom });
  }, [myTiles, zoom]);

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
      // Hide hover tooltip while panning — it's distracting.
      if (hovered) setHovered(null);
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

  // World-space pixel position of the (0,0) origin in the viewport.
  const originPxX = cx;
  const originPxY = cy;
  const majorEvery = 10 * cell;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="atmosphere absolute inset-0 pointer-events-none" aria-hidden />
      <div className="scanlines absolute inset-0 pointer-events-none" aria-hidden />
      <div className="rollingBar absolute inset-0 pointer-events-none" aria-hidden />
      <span className="cornerChrome cornerTL" aria-hidden />
      <span className="cornerChrome cornerTR" aria-hidden />
      <span className="cornerChrome cornerBL" aria-hidden />
      <span className="cornerChrome cornerBR" aria-hidden />

      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
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
        <svg width={size.w} height={size.h} className="block relative z-10">
          <defs>
            <pattern
              id="grid"
              width={cell}
              height={cell}
              patternUnits="userSpaceOnUse"
              x={(((cx - cell / 2) % cell) + cell) % cell}
              y={(((cy - cell / 2) % cell) + cell) % cell}
            >
              <path d={`M ${cell} 0 L 0 0 0 ${cell}`} fill="none" stroke="rgba(63, 185, 80, 0.07)" strokeWidth="1" />
            </pattern>
            <pattern
              id="gridMajor"
              width={majorEvery}
              height={majorEvery}
              patternUnits="userSpaceOnUse"
              x={(((originPxX - cell / 2) % majorEvery) + majorEvery) % majorEvery}
              y={(((originPxY - cell / 2) % majorEvery) + majorEvery) % majorEvery}
            >
              <path
                d={`M ${majorEvery} 0 L 0 0 0 ${majorEvery}`}
                fill="none"
                stroke="rgba(63, 185, 80, 0.18)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#gridMajor)" />
          {/* Origin axes: emphasize x=0 and y=0 so the map has a true centre. */}
          <line
            x1={originPxX}
            y1={0}
            x2={originPxX}
            y2={size.h}
            stroke="rgba(126, 231, 135, 0.18)"
            strokeWidth={1}
            strokeDasharray="2 4"
          />
          <line
            x1={0}
            y1={originPxY}
            x2={size.w}
            y2={originPxY}
            stroke="rgba(126, 231, 135, 0.18)"
            strokeWidth={1}
            strokeDasharray="2 4"
          />

          {/* Reachability rings sit BEHIND tiles */}
          {showReachRings && attackableSet &&
            tiles
              .filter((t) => attackableSet.has(`${t.x},${t.y}`))
              .map((t) => {
                const px = cx + t.x * cell - cell / 2;
                const py = cy - t.y * cell - cell / 2;
                return (
                  <rect
                    key={`reach_${t.x}_${t.y}`}
                    x={px - 3}
                    y={py - 3}
                    width={cell + 4}
                    height={cell + 4}
                    fill="none"
                    stroke="#56d3ff"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    style={{
                      filter: "drop-shadow(0 0 6px rgba(86, 211, 255, 0.6))",
                      animation: "reachPulse 1.6s ease-in-out infinite",
                    }}
                    pointerEvents="none"
                  />
                );
              })}

          {tiles.map((t) => {
            const px = cx + t.x * cell - cell / 2;
            const py = cy - t.y * cell - cell / 2;
            const klass = t.creature?.klass ?? "balanced";
            const color = KLASS_COLOR[klass] ?? "#7ee787";
            const isSelected = selected?.x === t.x && selected?.y === t.y;
            const isMine = !!viewerId && t.owner.id === viewerId;
            const isReachable = attackableSet?.has(`${t.x},${t.y}`) ?? false;

            const sameOwner = (nx: number, ny: number) =>
              ownerByCoord.get(`${nx},${ny}`) === t.owner.id;
            const top = !sameOwner(t.x, t.y + 1);
            const right = !sameOwner(t.x + 1, t.y);
            const bottom = !sameOwner(t.x, t.y - 1);
            const left = !sameOwner(t.x - 1, t.y);

            const strokeWidth = isSelected ? 3 : isReachable ? 2 : 1.5;

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
                onPointerEnter={(e) => {
                  if (e.pointerType !== "mouse") return;
                  if (drag.current?.captured) return;
                  setHovered({ tile: t, cx: e.clientX, cy: e.clientY });
                }}
                onPointerMove={(e) => {
                  if (e.pointerType !== "mouse") return;
                  if (drag.current?.captured) return;
                  setHovered((h) => (h && h.tile === t ? { tile: t, cx: e.clientX, cy: e.clientY } : h));
                }}
                onPointerLeave={() => setHovered((h) => (h?.tile === t ? null : h))}
                className="cursor-pointer"
              >
                <rect
                  x={px}
                  y={py}
                  width={cell - 2}
                  height={cell - 2}
                  fill={color}
                  fillOpacity={isSelected ? 0.34 : isMine ? 0.26 : 0.16}
                  stroke="none"
                />
                {top && (
                  <line x1={px} y1={py} x2={px + cell - 2} y2={py} stroke={color} strokeWidth={strokeWidth} />
                )}
                {right && (
                  <line
                    x1={px + cell - 2}
                    y1={py}
                    x2={px + cell - 2}
                    y2={py + cell - 2}
                    stroke={color}
                    strokeWidth={strokeWidth}
                  />
                )}
                {bottom && (
                  <line
                    x1={px}
                    y1={py + cell - 2}
                    x2={px + cell - 2}
                    y2={py + cell - 2}
                    stroke={color}
                    strokeWidth={strokeWidth}
                  />
                )}
                {left && (
                  <line x1={px} y1={py} x2={px} y2={py + cell - 2} stroke={color} strokeWidth={strokeWidth} />
                )}

                <text
                  x={px + cell / 2}
                  y={py + Math.max(14, cell * 0.22)}
                  textAnchor="middle"
                  fill={color}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize={Math.max(8, Math.min(11, cell * 0.18))}
                >
                  {(t.owner.name ?? "anon").slice(0, 8)}
                  {t.ad && <tspan fill="#d29922" fontSize={Math.max(7, cell * 0.16)}> ★</tspan>}
                </text>
                {t.ad?.text && (
                  <text
                    x={px + cell / 2}
                    y={py + Math.max(26, cell * 0.4)}
                    textAnchor="middle"
                    fill="#d29922"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize={Math.max(7, Math.min(9, cell * 0.15))}
                    fontStyle="italic"
                    opacity="0.95"
                  >
                    &quot;{t.ad.text.slice(0, 16)}&quot;
                  </text>
                )}
                {t.creature && (
                  <>
                    <text
                      x={px + cell / 2}
                      y={py + cell / 2 + (t.ad?.text ? 12 : 4)}
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

        <div className="absolute bottom-14 left-2 dim text-xs z-20">
          ({-Math.round(pan.x / cell)}, {Math.round(pan.y / cell)}) / {Math.round(zoom * 100)}% / {tiles.length} bases
          {loading ? " / loading" : ""}
          {error ? ` / ${error}` : ""}
        </div>
        <div className="absolute top-20 left-3 border border-fgMuted bg-bgPanel/90 px-3 py-2 z-20">
          <p className="text-sm text-fg">world map</p>
          <p className="dim text-xs">drag / scroll / click base</p>
          {showReachRings && (
            <p className="text-xs mt-1" style={{ color: "#56d3ff" }}>
              ◇ click any cyan-ring tile to attack
            </p>
          )}
        </div>
        <div className="absolute top-20 right-2 flex gap-2 z-20">
          {myTiles.length > 0 && (
            <button
              className="border border-fgMuted bg-bgPanel/90 px-3 py-1 text-sm text-fg hover:bg-fg hover:text-bg"
              onClick={(e) => {
                e.stopPropagation();
                goToMyTile();
              }}
              title="Go to my tile"
            >
              ⌖ me
            </button>
          )}
          <button
            className="border border-fgMuted bg-bgPanel/90 px-3 py-1 text-sm text-fg hover:bg-fg hover:text-bg"
            onClick={(e) => {
              e.stopPropagation();
              recenter();
            }}
            title="Recenter on origin"
          >
            ⊕ 0,0
          </button>
          <div className="flex border border-fgMuted bg-bgPanel/90">
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
        </div>
        <TileDetail
          tile={selected}
          viewerId={viewerId}
          isReachable={selected ? attackableSet?.has(`${selected.x},${selected.y}`) ?? false : false}
          isMine={!!selected && !!viewerId && selected.owner.id === viewerId}
          onClose={() => setSelected(null)}
        />
        {hovered && hovered.tile !== selected && (
          <TileHoverTip hover={hovered} viewportWidth={size.w} />
        )}
      </div>

      <style jsx>{`
        .atmosphere {
          background:
            radial-gradient(ellipse at 50% 35%, rgba(63, 185, 80, 0.05) 0%, transparent 60%),
            radial-gradient(ellipse at 20% 80%, rgba(86, 211, 255, 0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 85% 15%, rgba(210, 153, 34, 0.025) 0%, transparent 50%),
            linear-gradient(180deg, #050a05 0%, #0a0e0a 50%, #060906 100%);
        }
        .atmosphere::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(1px 1px at 12% 18%, rgba(126, 231, 135, 0.5) 0, transparent 50%),
            radial-gradient(1px 1px at 27% 64%, rgba(86, 211, 255, 0.45) 0, transparent 50%),
            radial-gradient(1px 1px at 41% 12%, rgba(126, 231, 135, 0.4) 0, transparent 50%),
            radial-gradient(1px 1px at 58% 78%, rgba(210, 153, 34, 0.4) 0, transparent 50%),
            radial-gradient(1px 1px at 72% 31%, rgba(126, 231, 135, 0.5) 0, transparent 50%),
            radial-gradient(1px 1px at 84% 56%, rgba(86, 211, 255, 0.4) 0, transparent 50%),
            radial-gradient(1px 1px at 91% 88%, rgba(126, 231, 135, 0.45) 0, transparent 50%),
            radial-gradient(1px 1px at 6% 92%, rgba(210, 153, 34, 0.35) 0, transparent 50%),
            radial-gradient(2px 2px at 33% 41%, rgba(126, 231, 135, 0.25) 0, transparent 50%),
            radial-gradient(2px 2px at 67% 9%, rgba(86, 211, 255, 0.3) 0, transparent 50%);
          background-size: 100% 100%;
        }
        .atmosphere::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.7) 100%);
          pointer-events: none;
        }
        /* Horizontal scanlines (matches the homepage CRT frame). */
        .scanlines {
          z-index: 15;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0) 0px,
            rgba(0, 0, 0, 0) 2px,
            rgba(0, 0, 0, 0.22) 3px,
            rgba(0, 0, 0, 0) 4px
          );
          mix-blend-mode: multiply;
        }
        /* Slow phosphor sweep top→bottom — gives the screen life. */
        .rollingBar {
          z-index: 14;
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(126, 231, 135, 0.04) 45%,
            rgba(126, 231, 135, 0.08) 50%,
            rgba(126, 231, 135, 0.04) 55%,
            transparent 100%
          );
          background-size: 100% 120px;
          background-repeat: no-repeat;
          animation: mapRollingBar 9s linear infinite;
        }
        @keyframes mapRollingBar {
          0% {
            background-position-y: -120px;
          }
          100% {
            background-position-y: calc(100% + 120px);
          }
        }
        /* Frame corner chrome — anchors the viewport like the battle frame does. */
        .cornerChrome {
          position: absolute;
          width: 18px;
          height: 18px;
          border-color: rgba(63, 185, 80, 0.55);
          z-index: 16;
          pointer-events: none;
        }
        .cornerTL {
          top: 6px;
          left: 6px;
          border-top: 1px solid;
          border-left: 1px solid;
        }
        .cornerTR {
          top: 6px;
          right: 6px;
          border-top: 1px solid;
          border-right: 1px solid;
        }
        .cornerBL {
          bottom: 6px;
          left: 6px;
          border-bottom: 1px solid;
          border-left: 1px solid;
        }
        .cornerBR {
          bottom: 6px;
          right: 6px;
          border-bottom: 1px solid;
          border-right: 1px solid;
        }
      `}</style>

      <style jsx global>{`
        @keyframes reachPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function TileDetail({
  tile,
  viewerId,
  isReachable,
  isMine,
  onClose,
}: {
  tile: MapTile | null;
  viewerId: string | null;
  isReachable: boolean;
  isMine: boolean;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!tile) return null;

  const canChallenge = !!viewerId && !isMine && !!tile.creature && isReachable;

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
      className="absolute right-3 top-32 w-[min(320px,calc(100vw-24px))] border border-fgMuted bg-bgPanel/95 p-5 space-y-3 shadow-lg z-30"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button onClick={onClose} className="absolute top-2 right-3 muted hover:text-fg text-sm" aria-label="Close">
        x
      </button>
      <p className="dim text-xs">
        tile ({tile.x}, {tile.y})
        {isMine && <span className="text-fg ml-2">· yours</span>}
        {!isMine && isReachable && <span style={{ color: "#56d3ff" }} className="ml-2">· in range</span>}
        {!isMine && !isReachable && viewerId && <span className="muted ml-2">· out of range</span>}
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
      {tile.ad && (tile.ad.text || tile.ad.url) && (
        <div className="border border-warn/50 bg-warn/5 p-2 space-y-1 mt-2">
          <p className="text-xs text-warn">★ paid message</p>
          {tile.ad.text && <p className="text-sm text-fg italic">&quot;{tile.ad.text}&quot;</p>}
          {tile.ad.url && (
            <a
              href={tile.ad.url.startsWith("http") ? tile.ad.url : `https://${tile.ad.url}`}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-xs underline break-all"
              style={{ color: "#56d3ff" }}
            >
              ↗ {tile.ad.url}
            </a>
          )}
        </div>
      )}
      {error && <p className="text-accent text-xs">{error}</p>}
      {isMine ? (
        <p className="text-xs muted">click any cyan-ringed tile around your bases to attack.</p>
      ) : !viewerId ? (
        <p className="text-xs muted">sign in to challenge.</p>
      ) : (
        <button
          onClick={challenge}
          disabled={busy || !canChallenge}
          className={`btn w-full ${!canChallenge ? "opacity-40 cursor-not-allowed" : ""}`}
          title={!isReachable ? "not within 2 king-steps of one of your tiles" : undefined}
        >
          {busy ? "starting…" : "⚔ challenge"}
        </button>
      )}
    </aside>
  );
}

function TileHoverTip({
  hover,
  viewportWidth,
}: {
  hover: { tile: MapTile; cx: number; cy: number };
  viewportWidth: number;
}) {
  const { tile, cx, cy } = hover;
  const klass = tile.creature?.klass ?? null;
  const color = klass ? KLASS_COLOR[klass] ?? "#7ee787" : "#7ee787";
  const TIP_WIDTH = 200;
  const flipX = cx + 14 + TIP_WIDTH > viewportWidth;
  const left = flipX ? cx - TIP_WIDTH - 14 : cx + 14;
  const top = cy + 14;

  return (
    <div
      className="pointer-events-none absolute z-20 border bg-bgPanel/95 px-3 py-2 text-xs shadow-lg"
      style={{
        left,
        top,
        width: TIP_WIDTH,
        borderColor: color,
        color,
      }}
    >
      <div className="text-fg text-sm leading-tight">{tile.owner.name ?? "anonymous"}</div>
      {tile.creature ? (
        <div className="dim mt-0.5">
          <span style={{ color }}>{klass ?? "—"}</span>
          <span className="muted"> · </span>
          <span className="text-fg">LV {tile.creature.level}</span>
          <span className="muted"> · </span>
          <span>{tile.creature.stage}</span>
        </div>
      ) : (
        <div className="muted mt-0.5">no creature</div>
      )}
      <div className="muted mt-1">
        ({tile.x}, {tile.y}) · click for details
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
