import { AdminAccessError, createAdminSupabaseClient, requireAdminEmail } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

function accessErrorResponse(error: unknown) {
  if (error instanceof AdminAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: "Unable to load members" }, { status: 500 });
}

export async function GET() {
  try {
    const email = await requireAdminEmail();
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load members for admin", error.message);
      return NextResponse.json({ error: "Unable to load members" }, { status: 500 });
    }

    return NextResponse.json(
      { email, members: data || [] },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return accessErrorResponse(error);
  }
}
