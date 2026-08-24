export const moderationActions: readonly ["approved", "rejected", "revoked"];

export type ModerationAction = (typeof moderationActions)[number];

export type ModerationInput = {
  memberId: string;
  action: ModerationAction;
  reason: string | null;
};

export type ParseResult =
  | { ok: true; value: ModerationInput }
  | { ok: false; error: string };

export function isValidMemberId(memberId: string): boolean;
export function parseModerationInput(memberId: string, payload: unknown): ParseResult;
