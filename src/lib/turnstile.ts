export async function verifyTurnstile(token: string, ip?: string) {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    return { ok: false, error: "Missing TURNSTILE_SECRET_KEY" };
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
      ...(ip ? { remoteip: ip } : {}),
    }).toString(),
  });

  if (!response.ok) {
    return { ok: false, error: "Turnstile verification failed" };
  }

  const data = (await response.json()) as { success: boolean; [key: string]: unknown };
  return { ok: data.success };
}
