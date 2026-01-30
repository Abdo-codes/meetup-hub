import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Member, Project } from "@/lib/types";
import { getGravatarUrl } from "@/lib/gravatar";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { PointsBadge } from "@/components/PointsBadge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard | Amsterdam AI Builders",
  description: "Top contributors in the Amsterdam AI Builders community",
};

async function getLeaderboard() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("members")
      .select("*, projects(id, title, clicks)")
      .eq("is_approved", true)
      .order("points", { ascending: false });
    return data as (Member & { projects: Pick<Project, "id" | "title" | "clicks">[] })[] | null;
  } catch {
    return null;
  }
}

function getRankStyle(rank: number) {
  switch (rank) {
    case 1:
      return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600/50";
    case 2:
      return "bg-slate-100 dark:bg-slate-700/30 border-slate-300 dark:border-slate-600/50";
    case 3:
      return "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600/50";
    default:
      return "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700";
  }
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return null;
  }
}

export default async function LeaderboardPage() {
  const members = await getLeaderboard();

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
          <ThemeToggle />
        </div>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl font-semibold mb-2">Leaderboard</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Top contributors in the community. Earn points by getting votes and clicks on your projects,
            and through community contributions.
          </p>
        </header>

        {/* Leaderboard */}
        {members && members.length > 0 ? (
          <div className="space-y-3">
            {members.map((member, index) => {
              const rank = index + 1;
              const rankIcon = getRankIcon(rank);
              const topProjects = member.projects
                ?.slice(0, 2)
                .map((p) => p.title);

              return (
                <Link
                  key={member.id}
                  href={`/m/${member.slug}`}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-colors hover:border-neutral-300 dark:hover:border-neutral-600 group ${getRankStyle(rank)}`}
                >
                  {/* Rank */}
                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    {rankIcon ? (
                      <span className="text-2xl">{rankIcon}</span>
                    ) : (
                      <span className="text-lg font-semibold text-neutral-400 dark:text-neutral-500">
                        {rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Image
                    src={member.image_url || getGravatarUrl(member.email)}
                    alt={member.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover border border-neutral-200 dark:border-neutral-600"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {member.name}
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        ↗
                      </span>
                    </div>
                    {topProjects && topProjects.length > 0 && (
                      <p className="text-neutral-500 text-sm truncate">
                        {topProjects.join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Points */}
                  <div className="shrink-0">
                    <PointsBadge points={member.points || 0} size="md" showLabel />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-neutral-500">No members on the leaderboard yet.</p>
            <Link
              href="/join"
              className="inline-block mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
            >
              Be the first to join
            </Link>
          </div>
        )}

        {/* Point Explainer */}
        <div className="mt-12 p-5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl">
          <h3 className="font-medium mb-3">How to earn points</h3>
          <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <li className="flex justify-between">
              <span>Project receives a vote</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">+5 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Project receives a click</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">+1 pt</span>
            </li>
            <li className="flex justify-between">
              <span>Community contributions</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">Varies</span>
            </li>
          </ul>
        </div>
      </div>

      <Footer />
    </main>
  );
}
