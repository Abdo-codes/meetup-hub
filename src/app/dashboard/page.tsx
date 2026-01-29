"use client";

import { createClient } from "@/lib/supabase";
import { Member, Project } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardPage() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

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
      setUser({ email: user.email! });

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
          image_url: memberData.image_url || "",
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
        setMessage("Profile saved!");
      }
    } else {
      // Create new
      const { error } = await supabase
        .from("members")
        .insert({ ...form, slug, email: user!.email });
      if (error) {
        setMessage("Error: " + error.message);
      } else {
        setMessage("Profile created! Awaiting approval.");
        // Refresh member data
        const { data } = await supabase
          .from("members")
          .select("*")
          .eq("email", user!.email)
          .single();
        setMember(data);
      }
    }

    setIsSaving(false);
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !newProject.title || !newProject.url) return;

    const { data, error } = await supabase
      .from("projects")
      .insert({ ...newProject, member_id: member.id })
      .select()
      .single();

    if (!error && data) {
      setProjects([...projects, data]);
      setNewProject({ title: "", description: "", url: "" });
    }
  };

  const handleDeleteProject = async (id: string) => {
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
            : "Your profile is pending approval."}
        </p>

        {message && (
          <div className="mb-6 p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm">
            {message}
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4 mb-12 p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl">
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
              className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              Profile Image URL
            </label>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none"
            />
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
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        {/* Projects */}
        {member && (
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
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) =>
                    setNewProject({ ...newProject, title: e.target.value })
                  }
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
                placeholder="Short description (optional)"
                className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-neutral-200 dark:bg-neutral-600 border border-neutral-300 dark:border-neutral-500 hover:bg-neutral-300 dark:hover:bg-neutral-500 rounded-lg transition-colors text-sm"
              >
                Add Project
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
