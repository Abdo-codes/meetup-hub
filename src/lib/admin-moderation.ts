export const moderationActions = ["approved", "rejected", "revoked"] as const;

export type ModerationAction = (typeof moderationActions)[number];

type ModerationInput = {
  memberId: string;
  action: ModerationAction;
  reason: string | null;
};

type ParseResult =
  | { ok: true; value: ModerationInput }
  | { ok: false; error: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_REASON_LENGTH = 500;

export function isValidMemberId(memberId: string) {
  return UUID_PATTERN.test(memberId);
}

export function parseModerationInput(memberId: string, payload: unknown): ParseResult {
  if (!isValidMemberId(memberId)) {
    return { ok: false, error: "Invalid member ID" };
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, error: "Invalid request body" };
  }

  const { action, reason } = payload as { action?: unknown; reason?: unknown };
  if (typeof action !== "string" || !moderationActions.includes(action as ModerationAction)) {
    return { ok: false, error: "Invalid moderation action" };
  }

  if (reason !== undefined && reason !== null && typeof reason !== "string") {
    return { ok: false, error: "Invalid rejection reason" };
  }

  const normalizedReason = typeof reason === "string" ? reason.trim() : "";
  if (action === "rejected" && !normalizedReason) {
    return { ok: false, error: "A rejection reason is required" };
  }
  if (normalizedReason.length > MAX_REASON_LENGTH) {
    return { ok: false, error: `Rejection reason must be ${MAX_REASON_LENGTH} characters or fewer` };
  }

  return {
    ok: true,
    value: {
      memberId,
      action: action as ModerationAction,
      reason: action === "rejected" ? normalizedReason : null,
    },
  };
}
