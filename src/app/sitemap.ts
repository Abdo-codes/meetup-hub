import { createServerSupabaseClient } from "@/lib/supabase-server";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://amsterdamaibuilders.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/join`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // Dynamic member pages
  try {
    const supabase = await createServerSupabaseClient();
    const { data: members } = await supabase
      .from("members")
      .select("slug, created_at")
      .eq("is_approved", true);

    const memberPages: MetadataRoute.Sitemap = (members || []).map((member) => ({
      url: `${baseUrl}/m/${member.slug}`,
      lastModified: new Date(member.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticPages, ...memberPages];
  } catch {
    return staticPages;
  }
}
