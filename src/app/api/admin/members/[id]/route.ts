import {
  AdminAccessError,
  createAdminSupabaseClient,
  requireAdminEmail,
  requireSameOrigin,
} from "@/lib/admin-auth";
import { isValidMemberId, parseModerationInput } from "@/lib/admin-moderation";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

function accessErrorResponse(error: unknown) {
  if (error instanceof AdminAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: "Unable to update member" }, { status: 500 });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    requireSameOrigin(request);
    const actorEmail = await requireAdminEmail();
    const { id } = await context.params;

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = parseModerationInput(id, payload);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.rpc("moderate_member", {
      p_member_id: parsed.value.memberId,
      p_action: parsed.value.action,
      p_reason: parsed.value.reason,
      p_actor_email: actorEmail,
    });

    if (error) {
      console.error("Failed to moderate member", error.message);
      return NextResponse.json({ error: "Unable to update member" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ member: data });
  } catch (error) {
    return accessErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    requireSameOrigin(request);
    await requireAdminEmail();
    const { id } = await context.params;
    if (!isValidMemberId(id)) {
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete member", error.message);
      return NextResponse.json({ error: "Unable to delete member" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return accessErrorResponse(error);
  }
}
