import type { Mood } from "../types.js";

export interface Particle {
  id: number;
  char: string;
  x: number;
  y: number;
  vy: number;
  ttl: number;
  age: number;
}

interface MoodConfig {
  chars: string[];
  spawnRate: number;
  drift: number;
  ttl: number;
}

const CONFIG: Record<Mood, MoodConfig> = {
  happy: { chars: ["✦", "✧", "*", "·"], spawnRate: 0.4, drift: -0.4, ttl: 14 },
  content: { chars: ["·", "˙"], spawnRate: 0.08, drift: -0.2, ttl: 10 },
  hungry: { chars: ["~", "~"], spawnRate: 0.25, drift: -0.15, ttl: 8 },
  tired: { chars: ["z", "Z", "z"], spawnRate: 0.3, drift: -0.5, ttl: 16 },
  grumpy: { chars: ["?", "!", "?"], spawnRate: 0.25, drift: -0.3, ttl: 10 },
  sick: { chars: ["☠", "x", "%"], spawnRate: 0.2, drift: -0.1, ttl: 8 },
};

export function configFor(mood: Mood): MoodConfig {
  return CONFIG[mood];
}

let nextId = 1;

export function step(particles: Particle[], mood: Mood, width: number): Particle[] {
  const cfg = CONFIG[mood];
  const alive = particles
    .map((p) => ({ ...p, y: p.y + p.vy, age: p.age + 1 }))
    .filter((p) => p.age < p.ttl && p.y > -1);

  if (Math.random() < cfg.spawnRate) {
    const char = cfg.chars[Math.floor(Math.random() * cfg.chars.length)] ?? "·";
    alive.push({
      id: nextId++,
      char,
      x: Math.floor(Math.random() * width),
      y: width > 0 ? Math.random() * 5 + 4 : 4,
      vy: cfg.drift,
      ttl: cfg.ttl,
      age: 0,
    });
  }

  return alive;
}

export function renderOverlay(particles: Particle[], width: number, height: number): string[] {
  const grid: string[][] = Array.from({ length: height }, () => Array<string>(width).fill(" "));
  for (const p of particles) {
    const yy = Math.floor(p.y);
    const xx = Math.floor(p.x);
    if (yy >= 0 && yy < height && xx >= 0 && xx < width) {
      const row = grid[yy];
      if (row) row[xx] = p.char;
    }
  }
  return grid.map((row) => row.join(""));
}
