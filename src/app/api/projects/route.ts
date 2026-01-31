import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isValidUrl } from "@/lib/validation";
import { NextResponse } from "next/server";

const MAX_PROJECTS = 5;

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const title = (payload.title || "").trim();
  const url = (payload.url || "").trim();

  if (!payload.memberId || !title || !url) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (title.length < 3 || title.length > 80) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }

  if (!isValidUrl(url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("member_id", payload.memberId);

  if ((count || 0) >= MAX_PROJECTS) {
    return NextResponse.json({ error: "Project limit reached" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      member_id: payload.memberId,
      title,
      description: payload.description || null,
      url,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, project: data });
}
