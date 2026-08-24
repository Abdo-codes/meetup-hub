import "server-only";

import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export class AdminAccessError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403 | 500
  ) {
    super(message);
  }
}

function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdminEmail() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    throw new AdminAccessError("Unauthorized", 401);
  }

  const normalizedEmail = user.email.toLowerCase();
  if (!adminEmails().includes(normalizedEmail)) {
    throw new AdminAccessError("Forbidden", 403);
  }

  return user.email;
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const allowedOrigins = new Set<string>();
  try {
    allowedOrigins.add(new URL(request.url).origin);
    if (configuredSiteUrl) {
      allowedOrigins.add(new URL(configuredSiteUrl).origin);
    }
  } catch {
    throw new AdminAccessError("Admin request origin is not configured", 500);
  }

  if (!origin || !allowedOrigins.has(origin)) {
    throw new AdminAccessError("Forbidden", 403);
  }
}

export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new AdminAccessError("Admin database access is not configured", 500);
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
