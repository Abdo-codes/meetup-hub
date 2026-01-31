import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isValidGitHub, isValidSlug, isValidTwitter, isValidUrl, slugify } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const name = (payload.name || "").trim();
  const slug = slugify(payload.slug || name);

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!slug || !isValidSlug(slug) || slug.length < 3) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  if (!isValidUrl(payload.website) || !isValidUrl(payload.image_url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!isValidTwitter(payload.twitter) || !isValidGitHub(payload.github)) {
    return NextResponse.json({ error: "Invalid handle" }, { status: 400 });
  }

  const { data: existingSlug } = await supabase
    .from("members")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingSlug && existingSlug.id !== payload.id) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  if (payload.id) {
    const { error } = await supabase
      .from("members")
      .update({
        name,
        slug,
        bio: payload.bio || null,
        image_url: payload.image_url || null,
        twitter: payload.twitter || null,
        github: payload.github || null,
        linkedin: payload.linkedin || null,
        website: payload.website || null,
      })
      .eq("id", payload.id)
      .eq("email", user.email);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, slug });
  }

  const { data, error } = await supabase
    .from("members")
    .insert({
      name,
      slug,
      bio: payload.bio || null,
      image_url: payload.image_url || null,
      twitter: payload.twitter || null,
      github: payload.github || null,
      linkedin: payload.linkedin || null,
      website: payload.website || null,
      email: user.email,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, member: data });
}
