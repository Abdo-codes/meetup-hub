import {
  AdminAccessError,
  createAdminSupabaseClient,
  requireAdminEmail,
  requireSameOrigin,
} from "@/lib/admin-auth";
import { isValidMemberId } from "@/lib/admin-moderation.mjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let actorEmail: string;
  try {
    requireSameOrigin(request);
    actorEmail = await requireAdminEmail();
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to award points" }, { status: 500 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { memberId, points, reason } = payload as {
    memberId?: unknown;
    points?: unknown;
    reason?: unknown;
  };
  const normalizedReason = typeof reason === "string" ? reason.trim() : "";

  if (
    typeof memberId !== "string" ||
    !isValidMemberId(memberId) ||
    typeof points !== "number" ||
    !Number.isInteger(points) ||
    points < 1 ||
    points > 10_000 ||
    !normalizedReason ||
    normalizedReason.length > 500
  ) {
    return NextResponse.json(
      { error: "Invalid member, points, or reason" },
      { status: 400 }
    );
  }

  let supabase;
  try {
    supabase = createAdminSupabaseClient();
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to award points" }, { status: 500 });
  }

  // Get admin's member ID if they have one (for awarded_by field)
  const { data: adminMember } = await supabase
    .from("members")
    .select("id")
    .eq("email", actorEmail)
    .maybeSingle();
  const awardedBy = adminMember?.id || null;

  // Award points using the database function
  const { error } = await supabase.rpc("award_points", {
    p_member_id: memberId,
    p_points: points,
    p_reason: normalizedReason,
    p_source: "admin",
    p_project_id: null,
    p_awarded_by: awardedBy,
  });

  if (error) {
    console.error("Failed to award admin points", error.message);
    return NextResponse.json(
      { error: "Failed to award points" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
