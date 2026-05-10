// Wireframe / line-art SVG sprites for Trickster + Sage with full
// state coverage. Same silhouette per character; states vary by
// eyes, mouth, arm/aura overlays.

import type { ReactElement } from "react";
import type { AttackerState, DefenderState } from "./sprites";

const TRICKSTER_STROKE = "#c9a8ff";
const TRICKSTER_GLOW = "rgba(201,168,255,0.6)";
const SAGE_STROKE = "#56d3ff";
const SAGE_GLOW = "rgba(86,211,255,0.6)";

interface SpriteWrapperProps {
  stroke: string;
  glow: string;
  children: ReactElement;
}

function Wrapper({ stroke, glow, children }: SpriteWrapperProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={88}
      height={88}
      fill="none"
      stroke={stroke}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        filter: `drop-shadow(0 0 8px ${glow})`,
        overflow: "visible",
      }}
    >
      {children}
    </svg>
  );
}

// === TRICKSTER ===

function TricksterBase(): ReactElement {
  return (
    <g>
      {/* pointed ears */}
      <path d="M20 12 L24 6 L26 16" />
      <path d="M44 12 L40 6 L38 16" />
      {/* face — diamond */}
      <path d="M32 14 L48 26 L44 38 L32 44 L20 38 L16 26 Z" />
    </g>
  );
}

function TricksterBodyIdle(): ReactElement {
  return (
    <g>
      <path d="M28 44 L24 56 L40 56 L36 44" />
      <path d="M14 50 L8 56" />
      <path d="M50 50 L56 56" />
    </g>
  );
}

function TricksterIdle() {
  return (
    <Wrapper stroke={TRICKSTER_STROKE} glow={TRICKSTER_GLOW}>
      <g>
        <TricksterBase />
        <path d="M24 26 L29 26" /> {/* eye L slit */}
        <path d="M35 26 L40 26" /> {/* eye R slit */}
        <path d="M27 34 Q32 36 37 34" /> {/* smirk */}
        <TricksterBodyIdle />
      </g>
    </Wrapper>
  );
}

function TricksterWindUp() {
  return (
    <Wrapper stroke={TRICKSTER_STROKE} glow={TRICKSTER_GLOW}>
      <g>
        <TricksterBase />
        <circle cx="26.5" cy="26" r="1.5" /> {/* alert eyes */}
        <circle cx="37.5" cy="26" r="1.5" />
        <path d="M28 34 L36 34" /> {/* tight mouth */}
        {/* arms back, ready */}
        <path d="M28 44 L22 56 L40 56 L36 44" />
        <path d="M14 48 L4 50" /> {/* arm pulled back L */}
        <path d="M50 48 L60 50" /> {/* arm pulled back R */}
      </g>
    </Wrapper>
  );
}

function TricksterStrike() {
  return (
    <Wrapper stroke={TRICKSTER_STROKE} glow={TRICKSTER_GLOW}>
      <g>
        <TricksterBase />
        <path d="M24 26 L29 26" />
        <path d="M35 26 L40 26" />
        <path d="M27 32 Q32 35 37 32" /> {/* fierce mouth */}
        {/* lunging forward, daggers extended */}
        <path d="M28 44 L26 56 L40 56 L36 44" />
        <path d="M14 50 L60 56" /> {/* extended slash */}
        <path d="M50 50 L4 56" />
        {/* slash effects */}
        <path d="M55 52 L60 50 L62 55" strokeWidth={1} />
        <path d="M9 52 L4 50 L2 55" strokeWidth={1} />
      </g>
    </Wrapper>
  );
}

function TricksterHit() {
  return (
    <Wrapper stroke={TRICKSTER_STROKE} glow={TRICKSTER_GLOW}>
      <g>
        <TricksterBase />
        {/* X eyes */}
        <path d="M24 24 L29 28 M24 28 L29 24" strokeWidth={1.6} />
        <path d="M35 24 L40 28 M35 28 L40 24" strokeWidth={1.6} />
        <circle cx="32" cy="34" r="2" /> {/* O mouth */}
        {/* slumped body */}
        <path d="M28 44 L20 56 L42 56 L38 44" />
        <path d="M14 52 L8 58" />
        <path d="M50 52 L58 58" />
        {/* sweat drops */}
        <path d="M14 16 L13 19 L15 19 Z" fill={TRICKSTER_STROKE} strokeWidth={0.5} />
      </g>
    </Wrapper>
  );
}

function TricksterDead() {
  return (
    <Wrapper stroke={TRICKSTER_STROKE} glow={TRICKSTER_GLOW}>
      <g opacity={0.5}>
        {/* lying flat — rotated horizontal */}
        <path d="M8 38 L12 30 L20 26 L36 24 L52 26 L60 30 L56 38 Z" />
        <path d="M22 30 L26 30" />
        <path d="M32 30 L36 30" />
        <path d="M28 36 L34 36" />
        {/* RIP cross */}
        <path d="M40 18 L40 24 M37 21 L43 21" strokeWidth={1} />
      </g>
    </Wrapper>
  );
}

function TricksterVictory() {
  return (
    <Wrapper stroke={TRICKSTER_STROKE} glow={TRICKSTER_GLOW}>
      <g>
        <TricksterBase />
        <path d="M24 26 Q26.5 24 29 26" /> {/* happy eyes ⌒⌒ */}
        <path d="M35 26 Q37.5 24 40 26" />
        <path d="M27 33 Q32 38 37 33" /> {/* big smile */}
        <path d="M28 44 L24 56 L40 56 L36 44" />
        {/* arms up in triumph */}
        <path d="M14 50 L4 38" />
        <path d="M50 50 L60 38" />
        {/* stars */}
        <path d="M2 34 L4 38 L8 38 L4 40 L6 44 L2 42 L-2 44 L0 40 L-4 38 L0 38 Z" strokeWidth={0.8} fill={TRICKSTER_STROKE} />
        <path d="M58 30 L60 34 L64 34 L60 36 L62 40 L58 38 L54 40 L56 36 L52 34 L56 34 Z" strokeWidth={0.8} fill={TRICKSTER_STROKE} />
      </g>
    </Wrapper>
  );
}

// === SAGE ===

function SageBase(): ReactElement {
  return (
    <g>
      <circle cx="32" cy="26" r="14" />
    </g>
  );
}

function SageBodyIdle(): ReactElement {
  return (
    <g>
      <path d="M22 38 L20 56 L44 56 L42 38" />
      <path d="M28 42 L28 52" />
      <path d="M36 42 L36 52" />
      <path d="M50 28 L50 56" />
      <circle cx="50" cy="24" r="3" />
    </g>
  );
}

function SageIdle() {
  return (
    <Wrapper stroke={SAGE_STROKE} glow={SAGE_GLOW}>
      <g>
        <SageBase />
        <circle cx="27" cy="24" r="2" />
        <circle cx="37" cy="24" r="2" />
        <path d="M27 32 Q32 35 37 32" />
        <SageBodyIdle />
      </g>
    </Wrapper>
  );
}

function SageChannel() {
  return (
    <Wrapper stroke={SAGE_STROKE} glow={SAGE_GLOW}>
      <g>
        <SageBase />
        {/* glowing eyes */}
        <circle cx="27" cy="24" r="2.5" />
        <circle cx="37" cy="24" r="2.5" />
        <circle cx="27" cy="24" r="0.8" fill={SAGE_STROKE} />
        <circle cx="37" cy="24" r="0.8" fill={SAGE_STROKE} />
        <path d="M27 32 Q32 33 37 32" /> {/* focused mouth */}
        <SageBodyIdle />
        {/* aura sparkles */}
        <path d="M14 18 L14 22 M12 20 L16 20" />
        <path d="M50 12 L50 16 M48 14 L52 14" />
        <path d="M10 30 L10 34 M8 32 L12 32" strokeWidth={1} />
        <path d="M54 38 L54 42 M52 40 L56 40" strokeWidth={1} />
      </g>
    </Wrapper>
  );
}

function SageCast() {
  return (
    <Wrapper stroke={SAGE_STROKE} glow={SAGE_GLOW}>
      <g>
        <SageBase />
        {/* wide eyes */}
        <circle cx="27" cy="24" r="3" />
        <circle cx="37" cy="24" r="3" />
        <path d="M28 30 Q32 36 36 30" /> {/* casting mouth (open) */}
        {/* arms outstretched */}
        <path d="M22 38 L8 48 L4 56" />
        <path d="M42 38 L56 48 L60 56" />
        <path d="M22 38 L22 56 L42 56 L42 38" />
        <path d="M28 42 L28 52" />
        <path d="M36 42 L36 52" />
        {/* energy burst */}
        <circle cx="32" cy="50" r="6" strokeWidth={1} />
        <circle cx="32" cy="50" r="3" strokeWidth={1} />
        {/* radiating */}
        <path d="M32 38 L32 32" strokeWidth={1} />
        <path d="M22 50 L18 50" strokeWidth={1} />
        <path d="M42 50 L46 50" strokeWidth={1} />
        <path d="M28 60 L26 64" strokeWidth={1} />
        <path d="M36 60 L38 64" strokeWidth={1} />
      </g>
    </Wrapper>
  );
}

function SageHit() {
  return (
    <Wrapper stroke={SAGE_STROKE} glow={SAGE_GLOW}>
      <g>
        <SageBase />
        <path d="M24 22 L30 26 M24 26 L30 22" strokeWidth={1.6} />
        <path d="M34 22 L40 26 M34 26 L40 22" strokeWidth={1.6} />
        <circle cx="32" cy="32" r="2.5" />
        <path d="M22 38 L18 56 L46 56 L42 38" />
        <path d="M28 42 L28 52" />
        <path d="M36 42 L36 52" />
        <path d="M50 30 L48 56" />
        <circle cx="48" cy="26" r="2" opacity={0.5} />
      </g>
    </Wrapper>
  );
}

function SageDead() {
  return (
    <Wrapper stroke={SAGE_STROKE} glow={SAGE_GLOW}>
      <g opacity={0.45}>
        {/* fallen */}
        <ellipse cx="32" cy="44" rx="18" ry="6" />
        <path d="M22 42 L26 42" />
        <path d="M38 42 L42 42" />
        <path d="M28 46 L36 46" />
        {/* RIP cross */}
        <path d="M16 32 L16 40 M12 36 L20 36" strokeWidth={1} />
      </g>
    </Wrapper>
  );
}

function SageVictory() {
  return (
    <Wrapper stroke={SAGE_STROKE} glow={SAGE_GLOW}>
      <g>
        <SageBase />
        <path d="M24 24 Q27 22 30 24" />
        <path d="M34 24 Q37 22 40 24" />
        <path d="M27 30 Q32 35 37 30" />
        {/* arms wide */}
        <path d="M22 38 L10 38 L8 56 L20 56" />
        <path d="M42 38 L54 38 L56 56 L44 56" />
        <path d="M22 38 L22 56 L42 56 L42 38" />
        {/* sparkle stars */}
        <path d="M14 12 L16 16 L20 16 L17 19 L18 23 L14 21 L10 23 L11 19 L8 16 L12 16 Z" strokeWidth={0.8} fill={SAGE_STROKE} />
        <path d="M50 12 L52 16 L56 16 L53 19 L54 23 L50 21 L46 23 L47 19 L44 16 L48 16 Z" strokeWidth={0.8} fill={SAGE_STROKE} />
      </g>
    </Wrapper>
  );
}

// === Public maps ===

export const TRICKSTER_SPRITES: Record<AttackerState, () => ReactElement> = {
  idle: TricksterIdle,
  wind_up: TricksterWindUp,
  strike: TricksterStrike,
  hit: TricksterHit,
  dead: TricksterDead,
  victory: TricksterVictory,
};

export const SAGE_SPRITES: Record<DefenderState, () => ReactElement> = {
  idle: SageIdle,
  channel: SageChannel,
  cast: SageCast,
  hit: SageHit,
  dead: SageDead,
  victory: SageVictory,
};
