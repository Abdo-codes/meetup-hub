import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  // Check if user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDev = process.env.NODE_ENV === "development";

  if (!isDev && (!user || !ADMIN_EMAILS.includes(user.email!))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memberId, points, reason } = await request.json();

  if (!memberId || !points || !reason) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Get admin's member ID if they have one (for awarded_by field)
  let awardedBy = null;
  if (user?.email) {
    const { data: adminMember } = await supabase
      .from("members")
      .select("id")
      .eq("email", user.email)
      .single();
    awardedBy = adminMember?.id || null;
  }

  // Award points using the database function
  const { error } = await supabase.rpc("award_points", {
    p_member_id: memberId,
    p_points: points,
    p_reason: reason,
    p_source: "admin",
    p_project_id: null,
    p_awarded_by: awardedBy,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to award points" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
