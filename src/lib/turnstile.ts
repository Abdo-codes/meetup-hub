import { TURNSTILE_ACTION } from "./turnstile-config";

export { TURNSTILE_ACTION } from "./turnstile-config";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MAX_TOKEN_LENGTH = 2_048;
const DEFAULT_TIMEOUT_MS = 5_000;

type TurnstileError =
  | "invalid-token"
  | "missing-secret"
  | "unavailable"
  | "verification-failed"
  | "action-mismatch"
  | "hostname-mismatch";

type TurnstileResult =
  | { ok: true }
  | { ok: false; error: TurnstileError };

type VerifyTurnstileOptions = {
  ip?: string;
  expectedHostname?: string;
  secretKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

type SiteverifyResponse = {
  success?: boolean;
  action?: string;
  hostname?: string;
};

export async function verifyTurnstile(
  token: unknown,
  options: VerifyTurnstileOptions = {}
): Promise<TurnstileResult> {
  if (
    typeof token !== "string" ||
    token.trim().length === 0 ||
    token.length > MAX_TOKEN_LENGTH
  ) {
    return { ok: false, error: "invalid-token" };
  }

  const secretKey = options.secretKey !== undefined
    ? options.secretKey
    : process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey?.trim()) {
    return { ok: false, error: "missing-secret" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  );

  try {
    const response = await (options.fetchImpl ?? fetch)(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey.trim(),
        response: token,
        ...(options.ip ? { remoteip: options.ip } : {}),
      }).toString(),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, error: "unavailable" };
    }

    const data = (await response.json()) as SiteverifyResponse;
    if (!data.success) {
      return { ok: false, error: "verification-failed" };
    }
    if (data.action !== TURNSTILE_ACTION) {
      return { ok: false, error: "action-mismatch" };
    }
    if (
      options.expectedHostname &&
      data.hostname?.toLowerCase() !== options.expectedHostname.toLowerCase()
    ) {
      return { ok: false, error: "hostname-mismatch" };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}
