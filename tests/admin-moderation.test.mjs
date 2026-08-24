import assert from "node:assert/strict";
import test from "node:test";

import { isValidMemberId, parseModerationInput } from "../src/lib/admin-moderation.mjs";

const memberId = "fd099e89-15d7-4f69-8df5-f24d0533010b";

test("accepts each moderation action and normalizes its reason", () => {
  assert.deepEqual(parseModerationInput(memberId, { action: "approved", reason: "ignored" }), {
    ok: true,
    value: { memberId, action: "approved", reason: null },
  });
  assert.deepEqual(parseModerationInput(memberId, { action: "revoked" }), {
    ok: true,
    value: { memberId, action: "revoked", reason: null },
  });
  assert.deepEqual(parseModerationInput(memberId, { action: "rejected", reason: "  incomplete profile  " }), {
    ok: true,
    value: { memberId, action: "rejected", reason: "incomplete profile" },
  });
});

test("rejects malformed identifiers, actions, and bodies", () => {
  assert.equal(isValidMemberId(memberId), true);
  assert.equal(isValidMemberId("not-a-uuid"), false);
  assert.deepEqual(parseModerationInput("not-a-uuid", { action: "approved" }), {
    ok: false,
    error: "Invalid member ID",
  });
  assert.deepEqual(parseModerationInput(memberId, { action: "deleted" }), {
    ok: false,
    error: "Invalid moderation action",
  });
  assert.deepEqual(parseModerationInput(memberId, []), {
    ok: false,
    error: "Invalid request body",
  });
});

test("requires a bounded reason only for rejection", () => {
  assert.deepEqual(parseModerationInput(memberId, { action: "rejected", reason: "  " }), {
    ok: false,
    error: "A rejection reason is required",
  });
  assert.deepEqual(parseModerationInput(memberId, { action: "rejected", reason: "x".repeat(501) }), {
    ok: false,
    error: "Rejection reason must be 500 characters or fewer",
  });
  assert.deepEqual(parseModerationInput(memberId, { action: "rejected", reason: 42 }), {
    ok: false,
    error: "Invalid rejection reason",
  });
});
