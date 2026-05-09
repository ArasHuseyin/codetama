const ANSI_RE = /\x1b\[[0-9;]*m/g;

const enabled =
  !!process.stdout.isTTY &&
  !process.env["NO_COLOR"] &&
  process.env["TERM"] !== "dumb";

function wrap(open: number, close: number): (s: string) => string {
  if (!enabled) return (s) => s;
  return (s) => `\x1b[${open}m${s}\x1b[${close}m`;
}

export const c = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  italic: wrap(3, 23),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  blue: wrap(34, 39),
  magenta: wrap(35, 39),
  cyan: wrap(36, 39),
  gray: wrap(90, 39),
  brightRed: wrap(91, 39),
  brightGreen: wrap(92, 39),
  brightYellow: wrap(93, 39),
  brightBlue: wrap(94, 39),
  brightMagenta: wrap(95, 39),
  brightCyan: wrap(96, 39),
};

export function visibleLength(s: string): number {
  return [...s.replace(ANSI_RE, "")].length;
}

export function classColor(klass: string | null): (s: string) => string {
  switch (klass) {
    case "warrior":
      return c.brightRed;
    case "sage":
      return c.brightCyan;
    case "trickster":
      return c.brightMagenta;
    case "balanced":
      return c.brightGreen;
    default:
      return (s) => s;
  }
}

export function ratioColor(ratio: number): (s: string) => string {
  if (ratio < 0.25) return c.brightRed;
  if (ratio < 0.6) return c.yellow;
  return c.green;
}

export function moodColor(mood: string): (s: string) => string {
  switch (mood) {
    case "happy":
      return c.brightYellow;
    case "sad":
      return c.blue;
    case "tired":
      return c.gray;
    case "hungry":
      return c.brightRed;
    case "dead":
      return c.gray;
    default:
      return (s) => s;
  }
}

export function moodIcon(mood: string): string {
  switch (mood) {
    case "happy":
      return "✦";
    case "sad":
      return "·";
    case "tired":
      return "z";
    case "hungry":
      return "✗";
    case "dead":
      return "✝";
    default:
      return "·";
  }
}
