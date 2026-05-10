// Variant 8: line-art / wireframe SVG sprites — outlines only, no fills.

import type { ReactElement, SVGProps } from "react";

interface WireframeProps {
  stroke: string;
  glow?: string;
}

function Wrapper({
  stroke,
  glow,
  children,
}: WireframeProps & { children: ReactElement }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={120}
      height={120}
      fill="none"
      stroke={stroke}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        filter: glow ? `drop-shadow(0 0 6px ${glow})` : undefined,
      }}
    >
      {children}
    </svg>
  );
}

export function WarriorWire(props: SVGProps<SVGSVGElement>) {
  return (
    <Wrapper {...{ stroke: "#ff7b72", glow: "rgba(255,123,114,0.6)" }}>
      <g>
        {/* helmet/horns */}
        <path d="M22 18 L18 8 L24 12" />
        <path d="M42 18 L46 8 L40 12" />
        {/* head */}
        <path d="M22 18 Q22 12 32 12 Q42 12 42 18 L42 32 Q42 38 32 38 Q22 38 22 32 Z" />
        {/* eyes */}
        <circle cx="27" cy="24" r="2" />
        <circle cx="37" cy="24" r="2" />
        {/* mouth */}
        <path d="M27 30 L37 30" />
        {/* body / shoulders */}
        <path d="M18 40 L46 40 L44 56 L20 56 Z" />
        {/* belt */}
        <path d="M21 48 L43 48" />
        {/* sword */}
        <path d="M10 48 L4 56" />
        <path d="M5 51 L9 47" />
      </g>
    </Wrapper>
  );
}

export function SageWire(_props: SVGProps<SVGSVGElement>) {
  return (
    <Wrapper {...{ stroke: "#56d3ff", glow: "rgba(86,211,255,0.6)" }}>
      <g>
        {/* aura sparkles */}
        <path d="M14 10 L14 16 M11 13 L17 13" />
        <path d="M50 12 L50 18 M47 15 L53 15" />
        <path d="M32 6 L32 10" />
        {/* head — round */}
        <circle cx="32" cy="26" r="14" />
        {/* eyes */}
        <circle cx="27" cy="24" r="2" />
        <circle cx="37" cy="24" r="2" />
        {/* serene mouth */}
        <path d="M27 32 Q32 35 37 32" />
        {/* robes */}
        <path d="M22 38 L20 56 L44 56 L42 38" />
        <path d="M28 42 L28 52" />
        <path d="M36 42 L36 52" />
        {/* staff */}
        <path d="M50 28 L50 56" />
        <circle cx="50" cy="24" r="3" />
      </g>
    </Wrapper>
  );
}

export function TricksterWire(_props: SVGProps<SVGSVGElement>) {
  return (
    <Wrapper {...{ stroke: "#c9a8ff", glow: "rgba(201,168,255,0.6)" }}>
      <g>
        {/* pointed ears */}
        <path d="M20 12 L24 6 L26 16" />
        <path d="M44 12 L40 6 L38 16" />
        {/* face — diamond shape */}
        <path d="M32 14 L48 26 L44 38 L32 44 L20 38 L16 26 Z" />
        {/* slit eyes */}
        <path d="M24 26 L29 26" />
        <path d="M35 26 L40 26" />
        {/* smirk */}
        <path d="M27 34 Q32 36 37 34" />
        {/* slim body / cape */}
        <path d="M28 44 L24 56 L40 56 L36 44" />
        {/* daggers crossed */}
        <path d="M14 50 L8 56" />
        <path d="M50 50 L56 56" />
      </g>
    </Wrapper>
  );
}

export function BalancedWire(_props: SVGProps<SVGSVGElement>) {
  return (
    <Wrapper {...{ stroke: "#d29922", glow: "rgba(210,153,34,0.6)" }}>
      <g>
        {/* small leaves on top */}
        <path d="M28 8 Q28 12 32 12 Q36 12 36 8" />
        {/* head */}
        <path d="M20 16 Q20 12 32 12 Q44 12 44 16 L44 32 Q44 38 32 38 Q20 38 20 32 Z" />
        {/* eyes */}
        <circle cx="27" cy="24" r="2" />
        <circle cx="37" cy="24" r="2" />
        {/* gentle mouth */}
        <path d="M27 32 Q32 34 37 32" />
        {/* balanced body */}
        <path d="M22 38 L22 56 L42 56 L42 38" />
        {/* 4 element marks */}
        <circle cx="26" cy="46" r="1.5" /> {/* str */}
        <circle cx="32" cy="46" r="1.5" /> {/* int */}
        <circle cx="38" cy="46" r="1.5" /> {/* dex */}
        <path d="M30 50 L34 50 M32 48 L32 52" /> {/* center cross */}
      </g>
    </Wrapper>
  );
}
