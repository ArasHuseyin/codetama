import { spawn } from "node:child_process";

/**
 * Best-effort attempt to open a URL in the user's default browser.
 * Silently does nothing on failure — the caller always prints the URL too,
 * so the user can copy/paste it.
 */
export function openBrowser(url: string): void {
  const platform = process.platform;
  try {
    if (platform === "win32") {
      spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    } else if (platform === "darwin") {
      spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    } else {
      spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
    }
  } catch {
    // ignore — user can copy/paste from stdout
  }
}
