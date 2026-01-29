import { createServerSupabaseClient } from "@/lib/supabase-server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "anonymous";

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

  return NextResponse.json({ success: true });
}
