import { meetup, events } from "@/data/meetup";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Member, Project } from "@/lib/types";
import { getGravatarUrl } from "@/lib/gravatar";
import Link from "next/link";
import Image from "next/image";
import { ProjectCard } from "@/components/ProjectCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { PointsBadge } from "@/components/PointsBadge";
import { JoinButton } from "@/components/JoinButton";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

async function getMembers() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("members")
      .select("id, name, slug, bio, image_url, points, created_at, projects(id, title, url, description, clicks, created_at)")
      .eq("is_approved", true)
      .order("created_at", { ascending: false });
    return data as (Member & { projects: Project[] })[] | null;
  } catch {
    return null;
  }
}

async function getTopProjects() {
  try {
    const supabase = await createServerSupabaseClient();
    // Use the view that calculates monthly votes
    const { data } = await supabase
      .from("projects_with_monthly_votes")
      .select("*, member:members!inner(name, slug, is_approved)")
      .eq("member.is_approved", true)
      .order("monthly_votes", { ascending: false })
      .order("clicks", { ascending: false })
      .limit(10);
    return data as (Project & { member: { name: string; slug: string } })[] | null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const members = await getMembers();
  const topProjects = await getTopProjects();

  return (
    <main id="main-content" className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-16">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold mb-2">{meetup.name}</h1>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg mb-4">{meetup.tagline}</p>
            </div>
            <ThemeToggle />
          </div>
          <p className="text-neutral-500 leading-relaxed">{meetup.description}</p>

          <div className="flex flex-wrap gap-4 mt-6">
            <Link
              href={meetup.links.luma}
              target="_blank"
              className="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors font-medium"
            >
              Join on Luma ↗
            </Link>
            <Link
              href={meetup.links.twitter}
              target="_blank"
              className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              Twitter
            </Link>
            <Link
              href={meetup.links.discord}
              target="_blank"
              className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              Discord
            </Link>
            <Link
              href={meetup.links.github}
              target="_blank"
              className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              GitHub
            </Link>
          </div>
        </header>

        {/* Upcoming Events */}
        <section className="mb-16">
          <h2 className="text-sm uppercase tracking-wider text-neutral-500 mb-6">
            Upcoming Events
          </h2>

          <div className="space-y-3">
            {events.map((event) => (
              <Link
                key={event.title + event.date}
                href={event.lumaLink}
                target="_blank"
                className="block p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-medium group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-neutral-500 text-sm mt-1">
                      {event.location}
                    </p>
                  </div>
                  <div className="text-right text-sm shrink-0">
                    <div className="text-neutral-600 dark:text-neutral-300">{formatDate(event.date)}</div>
                    <div className="text-neutral-500">{event.time}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href={meetup.links.luma}
            target="_blank"
            className="inline-block mt-4 text-sm text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
          >
            View all events on Luma →
          </Link>
        </section>

        {/* Top Projects This Month */}
        {topProjects && topProjects.length > 0 && (
          <section className="mb-16">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-sm uppercase tracking-wider text-neutral-500">
                Top Projects
              </h2>
              <span className="text-xs text-neutral-400 dark:text-neutral-600">
                {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
            </div>

            <div className="space-y-3">
              {topProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </section>
        )}

        {/* Members */}
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-sm uppercase tracking-wider text-neutral-500">
              Members
            </h2>
            <Link
              href="/leaderboard"
              className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              View leaderboard →
            </Link>
          </div>

          {members && members.length > 0 ? (
            <div className="space-y-3">
              {members.map((member) => (
                <Link
                  key={member.id}
                  href={`/m/${member.slug}`}
                  className="flex gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors group"
                >
                  <Image
                    src={member.image_url || (member.email ? getGravatarUrl(member.email) : "/avatar-placeholder.svg")}
                    alt={member.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover border border-neutral-200 dark:border-neutral-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 font-medium group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {member.name}
                      {member.points > 0 && <PointsBadge points={member.points} />}
                      <span className="opacity-0 group-hover:opacity-100 ml-1 transition-opacity">
                        ↗
                      </span>
                    </div>
                    {member.projects && member.projects.length > 0 && (
                      <p className="text-neutral-500 text-sm truncate">
                        {member.projects.map((p) => p.title).join(", ")}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-neutral-400 dark:text-neutral-500">
              No members yet. Be the first to join!
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <JoinButton />
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
