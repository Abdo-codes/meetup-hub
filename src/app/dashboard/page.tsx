"use client";

import { createClient } from "@/lib/supabase";
import { Member, Project, PointTransaction } from "@/lib/types";
import { getGravatarUrl } from "@/lib/gravatar";
import { isValidGitHub, isValidSlug, isValidTwitter, isValidUrl, slugify } from "@/lib/validation";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PointsBadge } from "@/components/PointsBadge";

const MAX_PROJECTS = 5;

type Identity = {
  id: string;
  provider: string;
  identity_data?: {
    email?: string;
    name?: string;
    avatar_url?: string;
  };
};

export default function DashboardPage() {
  const [user, setUser] = useState<{ email: string; avatarUrl?: string } | null>(null);
  const [identities, setIdentities] = useState<Identity[]>([]);
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

  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    url: "",
    web_url: "",
    apple_url: "",
    android_url: "",
  });
  const [linkInput, setLinkInput] = useState("");
  const [isParsingLinks, setIsParsingLinks] = useState(false);

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
      setIdentities((user.identities as Identity[]) || []);

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
        // Get projects with monthly votes
        const { data: projectsData } = await supabase
          .from("projects_with_monthly_votes")
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

    const slug = slugify(form.slug || form.name);

    if (!form.name.trim()) {
      setMessage("Name is required.");
      setIsSaving(false);
      return;
    }

    if (!slug || !isValidSlug(slug)) {
      setMessage("Please use a valid slug (letters, numbers, hyphens).");
      setIsSaving(false);
      return;
    }

    if (slug.length < 3) {
      setMessage("Slug must be at least 3 characters.");
      setIsSaving(false);
      return;
    }

    if (!isValidUrl(form.website) || !isValidUrl(form.image_url)) {
      setMessage("Please provide valid URLs for website or image.");
      setIsSaving(false);
      return;
    }

    if (!isValidTwitter(form.twitter)) {
      setMessage("Twitter handle looks invalid.");
      setIsSaving(false);
      return;
    }

    if (!isValidGitHub(form.github)) {
      setMessage("GitHub username looks invalid.");
      setIsSaving(false);
      return;
    }

    const { data: existingSlug } = await supabase
      .from("members")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug && (!member || existingSlug.id !== member.id)) {
      setMessage("That slug is already taken. Try another.");
      setIsSaving(false);
      return;
    }

    if (member) {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: member.id, slug }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(`Error: ${data.error || "Failed to update"}`);
      } else {
        setMember({ ...member, ...form, slug });
        setMessage("Profile updated successfully!");
        setIsEditing(false);
      }
    } else {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(`Error: ${data.error || "Failed to create"}`);
      } else {
        setMember(data.member);
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

  const parseLinks = async (input: string) => {
    setIsParsingLinks(true);
    setMessage("");

    // Extract all URLs from input
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = input.match(urlRegex) || [];

    if (urls.length === 0) {
      setMessage("No valid URLs found. Paste one or more links.");
      setIsParsingLinks(false);
      return;
    }

    let githubUrl = "";
    let webUrl = "";
    let appleUrl = "";
    let androidUrl = "";
    let title = "";
    let description = "";

    for (const url of urls) {
      const cleanUrl = url.replace(/[,;]$/, ""); // Remove trailing punctuation

      if (cleanUrl.includes("github.com")) {
        githubUrl = cleanUrl;
      } else if (cleanUrl.includes("apps.apple.com") || cleanUrl.includes("itunes.apple.com")) {
        appleUrl = cleanUrl;
      } else if (cleanUrl.includes("play.google.com")) {
        androidUrl = cleanUrl;
      } else {
        webUrl = cleanUrl;
      }
    }

    // If GitHub URL found, fetch repo info
    if (githubUrl) {
      const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        const [, owner, repo] = match;
        const repoName = repo.replace(/\.git$/, "").split("?")[0].split("#")[0];
        try {
          const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}`);
          if (res.ok) {
            const data = await res.json();
            title = data.name || repoName;
            description = data.description || "";
          } else {
            title = repoName;
          }
        } catch {
          title = repoName;
        }
      }
    }

    // Use web URL as primary if no GitHub, or GitHub as primary
    const primaryUrl = githubUrl || webUrl || appleUrl || androidUrl;

    setNewProject({
      title,
      description: description.slice(0, 200),
      url: primaryUrl,
      web_url: githubUrl ? webUrl : "", // Only set web_url if GitHub is primary
      apple_url: appleUrl,
      android_url: androidUrl,
    });

    setLinkInput("");
    setIsParsingLinks(false);

    if (title) {
      setMessage(`Found: ${title}. Review and click "Add Project".`);
    } else {
      setMessage("Links detected. Add a project name and click \"Add Project\".");
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !newProject.title || !newProject.url) return;

    if (projects.filter(p => !p.is_archived).length >= MAX_PROJECTS) {
      setMessage(`You can only add up to ${MAX_PROJECTS} projects.`);
      return;
    }

    if (newProject.title.trim().length < 3) {
      setMessage("Project title is too short.");
      return;
    }

    if (!isValidUrl(newProject.url)) {
      setMessage("Please provide a valid primary project URL.");
      return;
    }

    const extraUrls = [newProject.web_url, newProject.apple_url, newProject.android_url].filter(Boolean) as string[];
    if (extraUrls.some((value) => !isValidUrl(value))) {
      setMessage("Please provide valid web/apple/android links.");
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
      .insert({
        ...newProject,
        member_id: member.id,
        url: newProject.url.trim(),
        web_url: newProject.web_url?.trim() || null,
        apple_url: newProject.apple_url?.trim() || null,
        android_url: newProject.android_url?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      setMessage("Error adding project: " + error.message);
    } else if (data) {
      setProjects([...projects, data]);
      setNewProject({ title: "", description: "", url: "", web_url: "", apple_url: "", android_url: "" });
      setMessage("Project added successfully!");
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Delete this project permanently?")) return;
    await supabase.from("projects").delete().eq("id", id);
    setProjects(projects.filter((p) => p.id !== id));
  };

  const handleArchiveProject = async (id: string, isArchived: boolean) => {
    const { error } = await supabase
      .from("projects")
      .update({ is_archived: !isArchived })
      .eq("id", id);

    if (error) {
      setMessage("Error updating project: " + error.message);
    } else {
      setProjects(projects.map((p) =>
        p.id === id ? { ...p, is_archived: !isArchived } : p
      ));
      setMessage(isArchived ? "Project restored!" : "Project archived.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const linkProvider = async (provider: "github" | "google") => {
    setMessage("");
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setMessage(`Error linking ${provider}: ${error.message}`);
    }
  };

  const unlinkProvider = async (identity: Identity, provider: string) => {
    if (identities.length <= 1) {
      setMessage("You must have at least one login method.");
      return;
    }
    if (!confirm(`Unlink ${provider} from your account?`)) return;

    setMessage("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.auth.unlinkIdentity(identity as any);
    if (error) {
      setMessage(`Error unlinking ${provider}: ${error.message}`);
    } else {
      setIdentities(identities.filter((i) => i.id !== identity.id));
      setMessage(`${provider} has been unlinked from your account.`);
    }
  };

  const hasProvider = (provider: string) => identities.some((i) => i.provider === provider);

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

        {/* Linked Accounts */}
        <section className="mb-8 p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl">
          <h2 className="text-lg font-semibold mb-4">Linked Accounts</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Connect multiple login methods to your profile. You can sign in with any linked account.
          </p>

          <div className="space-y-3">
            {/* GitHub */}
            <div className="flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <div>
                  <div className="font-medium text-sm">GitHub</div>
                  {hasProvider("github") && (
                    <div className="text-xs text-neutral-500">
                      {identities.find((i) => i.provider === "github")?.identity_data?.email || "Connected"}
                    </div>
                  )}
                </div>
              </div>
              {hasProvider("github") ? (
                <button
                  onClick={() => {
                    const identity = identities.find((i) => i.provider === "github");
                    if (identity) unlinkProvider(identity, "github");
                  }}
                  disabled={identities.length <= 1}
                  className="px-3 py-1.5 text-xs text-red-500 dark:text-red-400 border border-red-300 dark:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={() => linkProvider("github")}
                  className="px-3 py-1.5 text-xs bg-neutral-200 dark:bg-neutral-600 border border-neutral-300 dark:border-neutral-500 hover:bg-neutral-300 dark:hover:bg-neutral-500 rounded-lg transition-colors"
                >
                  Connect
                </button>
              )}
            </div>

            {/* Google */}
            <div className="flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <div>
                  <div className="font-medium text-sm">Google</div>
                  {hasProvider("google") && (
                    <div className="text-xs text-neutral-500">
                      {identities.find((i) => i.provider === "google")?.identity_data?.email || "Connected"}
                    </div>
                  )}
                </div>
              </div>
              {hasProvider("google") ? (
                <button
                  onClick={() => {
                    const identity = identities.find((i) => i.provider === "google");
                    if (identity) unlinkProvider(identity, "google");
                  }}
                  disabled={identities.length <= 1}
                  className="px-3 py-1.5 text-xs text-red-500 dark:text-red-400 border border-red-300 dark:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={() => linkProvider("google")}
                  className="px-3 py-1.5 text-xs bg-neutral-200 dark:bg-neutral-600 border border-neutral-300 dark:border-neutral-500 hover:bg-neutral-300 dark:hover:bg-neutral-500 rounded-lg transition-colors"
                >
                  Connect
                </button>
              )}
            </div>

            {/* Email */}
            {hasProvider("email") && (
              <div className="flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="font-medium text-sm">Email</div>
                    <div className="text-xs text-neutral-500">{user?.email}</div>
                  </div>
                </div>
                <span className="px-3 py-1.5 text-xs text-neutral-500">Primary</span>
              </div>
            )}
          </div>
        </section>

        {/* Projects */}
        {member ? (
          <>
          <section className="p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4">Your Projects</h2>

            {projects.length > 0 && (
              <div className="space-y-3 mb-6">
                {projects.filter(p => !p.is_archived).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-start justify-between p-4 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{project.title}</div>
                      {project.description && (
                        <div className="text-neutral-500 text-sm">
                          {project.description}
                        </div>
                      )}
                      <div className="text-neutral-400 dark:text-neutral-500 text-xs mt-1">
                        {project.url}
                        {project.web_url && (
                          <span className="ml-2">Web</span>
                        )}
                        {project.apple_url && (
                          <span className="ml-2">Apple</span>
                        )}
                        {project.android_url && (
                          <span className="ml-2">Android</span>
                        )}
                      </div>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span className="text-amber-600 dark:text-amber-400">
                          {project.monthly_votes || 0} votes
                        </span>
                        <span className="text-neutral-500">
                          {project.clicks || 0} clicks
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-4">
                      <button
                        onClick={() => handleArchiveProject(project.id, false)}
                        className="px-2 py-1 text-sm text-neutral-500 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-colors"
                      >
                        Archive
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="px-2 py-1 text-sm text-red-500 dark:text-red-400 border border-red-300 dark:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Archived Projects */}
            {projects.filter(p => p.is_archived).length > 0 && (
              <details className="mt-4">
                <summary className="text-sm text-neutral-500 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300">
                  Archived projects ({projects.filter(p => p.is_archived).length})
                </summary>
                <div className="space-y-3 mt-3">
                  {projects.filter(p => p.is_archived).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-start justify-between p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl opacity-60"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{project.title}</div>
                        <div className="text-neutral-400 dark:text-neutral-500 text-xs mt-1">
                          {project.url}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0 ml-4">
                        <button
                          onClick={() => handleArchiveProject(project.id, true)}
                          className="px-2 py-1 text-sm text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="px-2 py-1 text-sm text-red-500 dark:text-red-400 border border-red-300 dark:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-600">
              <p className="text-sm text-neutral-500">
                Add a new project ({projects.filter(p => !p.is_archived).length}/{MAX_PROJECTS})
              </p>

              {/* Smart link input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="Paste links (GitHub, App Store, Play Store, website...)"
                  className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      parseLinks(linkInput);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => parseLinks(linkInput)}
                  disabled={!linkInput.trim() || isParsingLinks}
                  className="px-4 py-2 bg-amber-500 text-white border border-amber-600 hover:bg-amber-600 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isParsingLinks ? "..." : "Parse"}
                </button>
              </div>

              {/* Detected project preview */}
              {newProject.url && (
                <form onSubmit={handleAddProject} className="space-y-3 p-4 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl">
                  <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                    <span>Detected:</span>
                    {newProject.url.includes("github.com") && <span className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-600 rounded">GitHub</span>}
                    {newProject.web_url && <span className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-600 rounded">Web</span>}
                    {newProject.apple_url && <span className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-600 rounded">App Store</span>}
                    {newProject.android_url && <span className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-600 rounded">Play Store</span>}
                  </div>

                  <input
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    maxLength={80}
                    placeholder="Project name *"
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none"
                  />

                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    maxLength={200}
                    rows={2}
                    placeholder="About this project (optional)"
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none resize-none"
                  />

                  <div className="text-xs text-neutral-400 dark:text-neutral-500 space-y-1">
                    <div className="truncate">Primary: {newProject.url}</div>
                    {newProject.web_url && <div className="truncate">Web: {newProject.web_url}</div>}
                    {newProject.apple_url && <div className="truncate">Apple: {newProject.apple_url}</div>}
                    {newProject.android_url && <div className="truncate">Android: {newProject.android_url}</div>}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={projects.filter(p => !p.is_archived).length >= MAX_PROJECTS || !newProject.title}
                      className="px-4 py-2 bg-neutral-700 dark:bg-neutral-200 text-white dark:text-neutral-800 border border-neutral-600 dark:border-neutral-300 hover:bg-neutral-600 dark:hover:bg-neutral-300 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Project
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewProject({ title: "", description: "", url: "", web_url: "", apple_url: "", android_url: "" })}
                      className="px-4 py-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-sm"
                    >
                      Clear
                    </button>
                  </div>
                </form>
              )}

              {projects.filter(p => !p.is_archived).length >= MAX_PROJECTS && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  You reached the maximum number of projects.
                </p>
              )}
            </div>
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
          </>
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
