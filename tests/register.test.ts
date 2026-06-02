import { describe, it, expect, vi, afterEach } from "vitest";
import { buildRegisteredState } from "../src/commands/register.js";
import { validateToken } from "../src/core/sync.js";
import { newState } from "../src/core/state.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildRegisteredState", () => {
  it("flips the state into multiplayer mode with the given cloud config", () => {
    const start = newState("Solo", 1_700_000_000_000);
    expect(start.mode).toBe("local");

    const next = buildRegisteredState(start, "https://example.test", "tok_abc", {
      id: "user-1",
      name: "Ada",
    });

    expect(next.mode).toBe("multiplayer");
    expect(next.cloud).toEqual({
      serverUrl: "https://example.test",
      token: "tok_abc",
      userId: "user-1",
      username: "Ada",
      lastSyncAt: null,
      lastSyncError: null,
    });
  });

  it("preserves existing creatures and history", () => {
    const start = newState("Solo", 1_700_000_000_000);
    const next = buildRegisteredState(start, "https://x", "t", { id: "u", name: null });
    expect(next.creatures).toBe(start.creatures);
    expect(next.history).toBe(start.history);
    expect(next.cloud?.username).toBeNull();
  });
});

describe("validateToken", () => {
  const okResponse = (body: unknown): Response =>
    ({ ok: true, status: 200, json: async () => body }) as unknown as Response;

  it("returns the user on a successful response", async () => {
    const user = { id: "u1", name: "Ada", image: null };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ user, creatures: [] })));

    const result = await validateToken("https://srv", "tok");
    expect("error" in result).toBe(false);
    if (!("error" in result)) expect(result.user.id).toBe("u1");
  });

  it("reports a clear error for a revoked/invalid token (401)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 } as Response));
    const result = await validateToken("https://srv", "bad");
    expect(result).toEqual({ error: "invalid or revoked token" });
  });

  it("reports the status code for other non-ok responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response));
    const result = await validateToken("https://srv", "tok");
    expect(result).toEqual({ error: "server returned 500" });
  });

  it("reports network errors without throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const result = await validateToken("https://srv", "tok");
    expect(result).toEqual({ error: "network error: ECONNREFUSED" });
  });

  it("sends the token as a Bearer Authorization header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ user: { id: "u", name: null, image: null }, creatures: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await validateToken("https://srv", "tok_xyz");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://srv/api/cli/me",
      expect.objectContaining({ headers: { Authorization: "Bearer tok_xyz" } }),
    );
  });
});
