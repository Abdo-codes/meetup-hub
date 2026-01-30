import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Member, Project } from "@/lib/types";
import { getGravatarUrl } from "@/lib/gravatar";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ProjectCard } from "@/components/ProjectCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShareQRCode } from "@/components/ShareQRCode";
import { Footer } from "@/components/Footer";
import { PointsBadge } from "@/components/PointsBadge";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: member } = await supabase
    .from("members")
    .select("name, bio")
    .eq("slug", slug)
    .eq("is_approved", true)
    .single();

  if (!member) {
    return { title: "Member Not Found" };
  }

  return {
    title: member.name,
    description: member.bio || `${member.name}'s profile on Amsterdam AI Builders`,
    openGraph: {
      title: `${member.name} | Amsterdam AI Builders`,
      description: member.bio || `Check out ${member.name}'s AI projects`,
    },
  };
}

async function getMember(slug: string) {
  const supabase = await createServerSupabaseClient();

  // Get member info
  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("slug", slug)
    .eq("is_approved", true)
    .single();

  if (!member) return null;

  // Get projects with monthly votes
  const { data: projects } = await supabase
    .from("projects_with_monthly_votes")
    .select("*")
    .eq("member_id", member.id)
    .order("monthly_votes", { ascending: false });

  // Get rank among all approved members
  const { data: allMembers } = await supabase
    .from("members")
    .select("id, points")
    .eq("is_approved", true)
    .order("points", { ascending: false });

  const rank = allMembers
    ? allMembers.findIndex((m) => m.id === member.id) + 1
    : 0;
  const totalMembers = allMembers?.length || 0;

  return {
    ...member,
    projects: projects || [],
    rank,
    totalMembers,
  } as Member & { projects: Project[]; rank: number; totalMembers: number };
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = await getMember(slug);

  if (!member) {
    notFound();
  }

  return (
    <main id="main-content" className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors text-sm"
          >
            ← Back to Amsterdam AI Builders
          </Link>
          <div className="flex items-center gap-2">
            <ShareQRCode slug={member.slug} name={member.name} />
            <ThemeToggle />
          </div>
        </div>

        {/* Profile Header */}
        <header className="mb-12 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
          <div className="flex items-start gap-6 mb-6">
            <Image
              src={member.image_url || getGravatarUrl(member.email)}
              alt={member.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-600"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-semibold">{member.name}</h1>
                <PointsBadge points={member.points || 0} size="md" showLabel />
              </div>
              {member.rank > 0 && (
                <p className="text-neutral-500 text-sm mb-2">
                  Rank #{member.rank} of {member.totalMembers} members
                </p>
              )}
              {member.bio && (
                <p className="text-neutral-600 dark:text-neutral-400 mt-2">{member.bio}</p>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="flex flex-wrap gap-3">
            {member.twitter && (
              <Link
                href={`https://twitter.com/${member.twitter}`}
                target="_blank"
                className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors"
              >
                Twitter
              </Link>
            )}
            {member.github && (
              <Link
                href={`https://github.com/${member.github}`}
                target="_blank"
                className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors"
              >
                GitHub
              </Link>
            )}
            {member.linkedin && (
              <Link
                href={`https://linkedin.com/in/${member.linkedin}`}
                target="_blank"
                className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors"
              >
                LinkedIn
              </Link>
            )}
            {member.website && (
              <Link
                href={member.website}
                target="_blank"
                className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors"
              >
                Website ↗
              </Link>
            )}
          </div>
        </header>

        {/* Projects */}
        {member.projects && member.projects.length > 0 && (
          <section>
            <h2 className="text-sm uppercase tracking-wider text-neutral-500 mb-6">
              Projects
            </h2>

            <div className="space-y-3">
              {member.projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </main>
  );
}
