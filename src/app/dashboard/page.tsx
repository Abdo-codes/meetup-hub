"use client";

import { createClient } from "@/lib/supabase";
import { Member, Project, PointTransaction } from "@/lib/types";
import { getGravatarUrl } from "@/lib/gravatar";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PointsBadge } from "@/components/PointsBadge";

const MAX_PROJECTS = 5;

export default function DashboardPage() {
  const [user, setUser] = useState<{ email: string; avatarUrl?: string } | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    bio: "",
    image_url: "",
    twitter: "",
    github: "",
    linkedin: "",
    website: "",
  });

  const [newProject, setNewProject] = useState({ title: "", description: "", url: "" });

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/join");
        return;
      }

      // Get avatar from OAuth provider metadata (GitHub/Google)
      const oauthAvatar = user.user_metadata?.avatar_url ||
                          user.user_metadata?.picture ||
                          getGravatarUrl(user.email!);

      setUser({ email: user.email!, avatarUrl: oauthAvatar });

      // Get member profile
      const { data: memberData } = await supabase
        .from("members")
        .select("*")
        .eq("email", user.email)
        .single();

      if (memberData) {
        setMember(memberData);
        setForm({
          name: memberData.name || "",
          slug: memberData.slug || "",
          bio: memberData.bio || "",
          image_url: memberData.image_url || oauthAvatar || "",
          twitter: memberData.twitter || "",
          github: memberData.github || "",
          linkedin: memberData.linkedin || "",
          website: memberData.website || "",
        });
        // Get projects
        const { data: projectsData } = await supabase
          .from("projects")
          .select("*")
          .eq("member_id", memberData.id);
        setProjects(projectsData || []);

        const { data: transactionsData } = await supabase
          .from("point_transactions")
          .select("*")
          .eq("member_id", memberData.id)
          .order("created_at", { ascending: false })
          .limit(20);
        setTransactions(transactionsData || []);
      } else {
        // New user - show edit mode by default
        setIsEditing(true);
        setForm({
          name: user.user_metadata?.full_name || user.user_metadata?.name || "",
          slug: "",
          bio: "",
          image_url: oauthAvatar || "",
          twitter: "",
          github: user.user_metadata?.user_name || "",
          linkedin: "",
          website: "",
        });
      }

      setIsLoading(false);
    };

    getUser();
  }, [router, supabase]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-");

    if (member) {
      // Update existing
      const { error } = await supabase
        .from("members")
        .update({ ...form, slug })
        .eq("id", member.id);
      if (error) {
        setMessage("Error: " + error.message);
      } else {
        setMember({ ...member, ...form, slug });
        setMessage("Profile updated successfully!");
        setIsEditing(false);
      }
    } else {
      // Create new
      const { data, error } = await supabase
        .from("members")
        .insert({ ...form, slug, email: user!.email })
        .select()
        .single();
      if (error) {
        setMessage("Error: " + error.message);
      } else {
        setMember(data);
        setMessage("Profile created! An admin will review and approve it shortly.");
        setIsEditing(false);
      }
    }

    setIsSaving(false);
  };

  const handleCancelEdit = () => {
    if (member) {
      // Reset form to current member data
      setForm({
        name: member.name || "",
        slug: member.slug || "",
        bio: member.bio || "",
        image_url: member.image_url || user?.avatarUrl || "",
        twitter: member.twitter || "",
        github: member.github || "",
        linkedin: member.linkedin || "",
        website: member.website || "",
      });
      setIsEditing(false);
      setMessage("");
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !newProject.title || !newProject.url) return;

    if (projects.length >= MAX_PROJECTS) {
      setMessage(`You can only add up to ${MAX_PROJECTS} projects.`);
      return;
    }

    if (newProject.title.trim().length < 3) {
      setMessage("Project title is too short.");
      return;
    }

    if (!isValidUrl(newProject.url)) {
      setMessage("Please provide a valid project URL.");
      return;
    }

    const normalizedUrl = newProject.url.trim().toLowerCase();
    if (projects.some((project) => project.url.trim().toLowerCase() === normalizedUrl)) {
      setMessage("You already added this project URL.");
      return;
    }

    setMessage("");

    const { data, error } = await supabase
      .from("projects")
      .insert({ ...newProject, member_id: member.id, url: newProject.url.trim() })
      .select()
      .single();

    if (error) {
      setMessage("Error adding project: " + error.message);
    } else if (data) {
      setProjects([...projects, data]);
      setNewProject({ title: "", description: "", url: "" });
      setMessage("Project added successfully!");
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    await supabase.from("projects").delete().eq("id", id);
    setProjects(projects.filter((p) => p.id !== id));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors text-sm"
          >
            ← Back to home
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSignOut}
              className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors text-sm"
            >
              Sign out
            </button>
            <ThemeToggle />
          </div>
        </div>

        <h1 className="text-2xl font-semibold mb-2">Your Profile</h1>
        <p className="text-neutral-500 mb-8">
          {member?.is_approved
            ? "Your profile is live!"
            : member
            ? "Your profile is pending approval."
            : "Create your profile to join the community."}
        </p>

        {message && (
          <div className="mb-6 p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm">
            {message}
          </div>
        )}

        {/* Profile Section */}
        {isEditing ? (
          /* Edit Mode */
          <form onSubmit={handleSaveProfile} className="space-y-4 mb-12 p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Edit Profile</h2>
              {member && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  Cancel
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                Profile URL slug
              </label>
              <div className="flex items-center">
                <span className="text-neutral-400 dark:text-neutral-500 text-sm mr-1">/m/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  placeholder={form.name.toLowerCase().replace(/\s+/g, "-") || "your-name"}
                  className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={2}
                maxLength={280}
                className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                Profile Image
              </label>
              <div className="flex items-center gap-4">
                {form.image_url ? (
                  <Image
                    src={form.image_url}
                    alt="Profile preview"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover border border-neutral-200 dark:border-neutral-600"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-neutral-500 dark:text-neutral-400 font-medium text-xl">
                    {form.name.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://... (auto-filled from GitHub/Google)"
                    className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none"
                  />
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    Uses your GitHub/Google avatar or Gravatar by default
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Twitter</label>
                <input
                  type="text"
                  value={form.twitter}
                  onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                  placeholder="username"
                  className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">GitHub</label>
                <input
                  type="text"
                  value={form.github}
                  onChange={(e) => setForm({ ...form, github: e.target.value })}
                  placeholder="username"
                  className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">LinkedIn</label>
                <input
                  type="text"
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  placeholder="username"
                  className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-neutral-700 dark:bg-neutral-200 text-neutral-100 dark:text-neutral-800 border border-neutral-600 dark:border-neutral-300 rounded-lg hover:bg-neutral-600 dark:hover:bg-neutral-300 disabled:opacity-50 transition-colors"
            >
              {isSaving ? "Saving..." : member ? "Save Changes" : "Create Profile"}
            </button>
          </form>
        ) : (
          /* View Mode */
          <div className="mb-12 p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                {member?.image_url || user?.avatarUrl ? (
                  <Image
                    src={member?.image_url || user?.avatarUrl || ""}
                    alt={member?.name || "Profile"}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-600"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-700 border-2 border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-neutral-500 dark:text-neutral-400 font-medium text-2xl">
                    {member?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-semibold">{member?.name}</h2>
                    {member && <PointsBadge points={member.points || 0} />}
                  </div>
                  <p className="text-neutral-500 text-sm">/m/{member?.slug}</p>
                  {member?.bio && (
                    <p className="text-neutral-600 dark:text-neutral-400 mt-2">{member.bio}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-sm border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                Edit
              </button>
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap gap-2">
              {member?.twitter && (
                <Link
                  href={`https://twitter.com/${member.twitter}`}
                  target="_blank"
                  className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors"
                >
                  Twitter
                </Link>
              )}
              {member?.github && (
                <Link
                  href={`https://github.com/${member.github}`}
                  target="_blank"
                  className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors"
                >
                  GitHub
                </Link>
              )}
              {member?.linkedin && (
                <Link
                  href={`https://linkedin.com/in/${member.linkedin}`}
                  target="_blank"
                  className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors"
                >
                  LinkedIn
                </Link>
              )}
              {member?.website && (
                <Link
                  href={member.website}
                  target="_blank"
                  className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors"
                >
                  Website ↗
                </Link>
              )}
              {!member?.twitter && !member?.github && !member?.linkedin && !member?.website && (
                <p className="text-neutral-400 dark:text-neutral-500 text-sm">
                  No social links added yet.{" "}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Add some
                  </button>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Projects */}
        {member ? (
          <section className="p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4">Your Projects</h2>

            {projects.length > 0 && (
              <div className="space-y-3 mb-6">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-start justify-between p-4 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl"
                  >
                    <div>
                      <div className="font-medium">{project.title}</div>
                      {project.description && (
                        <div className="text-neutral-500 text-sm">
                          {project.description}
                        </div>
                      )}
                      <div className="text-neutral-400 dark:text-neutral-500 text-xs mt-1">
                        {project.url}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="px-2 py-1 text-sm text-red-500 dark:text-red-400 border border-red-300 dark:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddProject} className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-600">
              <p className="text-sm text-neutral-500 mb-2">
                Add a new project ({projects.length}/{MAX_PROJECTS})
              </p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) =>
                    setNewProject({ ...newProject, title: e.target.value })
                  }
                  maxLength={80}
                  placeholder="Project name"
                  className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none"
                />
                <input
                  type="url"
                  value={newProject.url}
                  onChange={(e) =>
                    setNewProject({ ...newProject, url: e.target.value })
                  }
                  placeholder="https://..."
                  className="px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none"
                />
              </div>
              <input
                type="text"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
                maxLength={200}
                placeholder="Short description (optional)"
                className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={projects.length >= MAX_PROJECTS}
                className="px-4 py-2 bg-neutral-200 dark:bg-neutral-600 border border-neutral-300 dark:border-neutral-500 hover:bg-neutral-300 dark:hover:bg-neutral-500 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Project
              </button>
              {projects.length >= MAX_PROJECTS && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  You reached the maximum number of projects.
                </p>
              )}
            </form>
          </section>

          <section className="mt-8 p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4">Points History</h2>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-start justify-between gap-4 p-3 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl"
                  >
                    <div>
                      <div className="text-sm font-medium text-neutral-700 dark:text-neutral-100">
                        {tx.reason}
                      </div>
                      <div className="text-xs text-neutral-400 dark:text-neutral-500">
                        {new Date(tx.created_at).toLocaleString()}
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${tx.points >= 0 ? "text-amber-600 dark:text-amber-400" : "text-red-500"}`}>
                      {tx.points >= 0 ? "+" : ""}{tx.points}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No point activity yet.</p>
            )}
          </section>
        ) : !isEditing ? (
          <section className="p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl">
            <h2 className="text-lg font-semibold mb-2">Your Projects</h2>
            <p className="text-neutral-500 text-sm">
              Create your profile first, then you can add your projects here.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
