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

  const rateLimit = checkRateLimit(`vote:${id}:${ip}`, 5, 60_000);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.retryAfter || 0) / 1000)) } }
    );
  }

  const supabase = await createServerSupabaseClient();

  // Check if already voted this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: existingVote } = await supabase
    .from("project_votes")
    .select("id")
    .eq("project_id", id)
    .eq("voter_ip", ip)
    .gte("voted_at", startOfMonth.toISOString())
    .single();

  if (existingVote) {
    return NextResponse.json({ error: "Already voted" }, { status: 400 });
  }

  // Add vote record (voted_at is set automatically by database)
  const { error } = await supabase
    .from("project_votes")
    .insert({ project_id: id, voter_ip: ip });

  if (error) {
    return NextResponse.json({ error: "Vote failed" }, { status: 500 });
  }

  // Award points to project owner
  const { data: project } = await supabase
    .from("projects")
    .select("member_id, title")
    .eq("id", id)
    .single();

  if (project?.member_id) {
    await supabase.rpc("award_points", {
      p_member_id: project.member_id,
      p_points: 5,
      p_reason: `Vote received on "${project.title}"`,
      p_source: "vote",
      p_project_id: id,
    });
  }

  return NextResponse.json({ success: true });
}
