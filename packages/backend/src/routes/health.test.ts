import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("GET /health", () => {
  it("returns status ok with timestamp", async () => {
    const res = await app.request("/health");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it("returns Content-Type application/json", async () => {
    const res = await app.request("/health");

    expect(res.headers.get("content-type")).toContain("application/json");
  });
});
