import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TURNSTILE_ACTION, verifyTurnstile } from "./turnstile";

const secretKey = "test-secret";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("verifyTurnstile", () => {
  it("rejects missing, non-string, and oversized tokens without a network request", async () => {
    const invalidTokens = [undefined, null, "", " ", 42, "x".repeat(2049)];
    let requestCount = 0;

    for (const token of invalidTokens) {
      const result = await verifyTurnstile(token, {
        secretKey,
        fetchImpl: async () => {
          requestCount += 1;
          return jsonResponse({ success: true });
        },
      });

      assert.deepEqual(result, { ok: false, error: "invalid-token" });
    }

    assert.equal(requestCount, 0);
  });

  it("sends the token and visitor IP, then accepts the expected action and hostname", async () => {
    const result = await verifyTurnstile("valid-token", {
      secretKey,
      ip: "203.0.113.10",
      expectedHostname: "example.com",
      fetchImpl: async (_input, init) => {
        assert.equal(init?.method, "POST");
        assert.equal(init?.headers && new Headers(init.headers).get("Content-Type"), "application/x-www-form-urlencoded");
        assert.ok(init?.signal);

        const body = new URLSearchParams(String(init?.body));
        assert.equal(body.get("secret"), secretKey);
        assert.equal(body.get("response"), "valid-token");
        assert.equal(body.get("remoteip"), "203.0.113.10");

        return jsonResponse({
          success: true,
          action: TURNSTILE_ACTION,
          hostname: "example.com",
        });
      },
    });

    assert.deepEqual(result, { ok: true });
  });

  it("rejects otherwise successful responses for the wrong action or hostname", async () => {
    const wrongAction = await verifyTurnstile("valid-token", {
      secretKey,
      expectedHostname: "example.com",
      fetchImpl: async () => jsonResponse({
        success: true,
        action: "login",
        hostname: "example.com",
      }),
    });
    const wrongHostname = await verifyTurnstile("valid-token", {
      secretKey,
      expectedHostname: "example.com",
      fetchImpl: async () => jsonResponse({
        success: true,
        action: TURNSTILE_ACTION,
        hostname: "attacker.example",
      }),
    });

    assert.deepEqual(wrongAction, { ok: false, error: "action-mismatch" });
    assert.deepEqual(wrongHostname, { ok: false, error: "hostname-mismatch" });
  });

  it("fails closed when configuration or Siteverify is unavailable", async () => {
    const missingSecret = await verifyTurnstile("valid-token", {
      secretKey: "",
    });
    const upstreamError = await verifyTurnstile("valid-token", {
      secretKey,
      fetchImpl: async () => jsonResponse({}, 503),
    });
    const networkError = await verifyTurnstile("valid-token", {
      secretKey,
      fetchImpl: async () => {
        throw new Error("offline");
      },
    });

    assert.deepEqual(missingSecret, { ok: false, error: "missing-secret" });
    assert.deepEqual(upstreamError, { ok: false, error: "unavailable" });
    assert.deepEqual(networkError, { ok: false, error: "unavailable" });
  });

  it("aborts a Siteverify request that exceeds the configured timeout", async () => {
    const result = await verifyTurnstile("valid-token", {
      secretKey,
      timeoutMs: 1,
      fetchImpl: async (_input, init) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      }),
    });

    assert.deepEqual(result, { ok: false, error: "unavailable" });
  });
});
