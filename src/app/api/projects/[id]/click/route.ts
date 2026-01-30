import { createServerSupabaseClient } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) ||
    headersList.get("x-real-ip") ||
    headersList.get("cf-connecting-ip") ||
    "unknown";

  const rateLimit = checkRateLimit(`click:${id}:${ip}`, 20, 60_000);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.retryAfter || 0) / 1000)) } }
    );
  }

  const supabase = await createServerSupabaseClient();

  // Increment click count
  await supabase.rpc("increment_clicks", { project_id: id });

  // Award point to project owner
  const { data: project } = await supabase
    .from("projects")
    .select("member_id, title")
    .eq("id", id)
    .single();

  if (project?.member_id) {
    await supabase.rpc("award_points", {
      p_member_id: project.member_id,
      p_points: 1,
      p_reason: `Click on "${project.title}"`,
      p_source: "click",
      p_project_id: id,
    });
  }

  return NextResponse.json({ success: true });
}
