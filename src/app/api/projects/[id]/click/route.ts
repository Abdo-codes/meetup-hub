import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
