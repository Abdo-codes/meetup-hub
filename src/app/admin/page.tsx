"use client";

import { createClient } from "@/lib/supabase";
import { Member } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PointsBadge } from "@/components/PointsBadge";

const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || [];

interface AwardModalProps {
  member: Member;
  onClose: () => void;
  onAward: (memberId: string, points: number, reason: string) => Promise<void>;
}

function AwardPointsModal({ member, onClose, onAward }: AwardModalProps) {
  const [points, setPoints] = useState(10);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    await onAward(member.id, points, reason);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 w-full max-w-md mx-4 shadow-xl">
        <h2 className="text-lg font-semibold mb-1">Award Points</h2>
        <p className="text-neutral-500 text-sm mb-4">
          Award points to {member.name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Points</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              min={1}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Speaking at meetup, helping members..."
              className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Awarding..." : `Award ${points} pts`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [awardingMember, setAwardingMember] = useState<Member | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      // Local dev bypass - skip auth on localhost
      const isLocalDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

      if (!isLocalDev) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !ADMIN_EMAILS.includes(user.email!)) {
          router.push("/");
          return;
        }
        setUser({ email: user.email! });
      } else {
        setUser({ email: "admin@localhost" });
      }

      // Get all members
      const { data } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });
      setMembers(data || []);
      setIsLoading(false);
    };

    loadData();
  }, [router, supabase]);

  const handleApprove = async (id: string) => {
    await supabase.from("members").update({ is_approved: true }).eq("id", id);
    setMembers(
      members.map((m) => (m.id === id ? { ...m, is_approved: true } : m))
    );
  };

  const handleRevoke = async (id: string) => {
    await supabase.from("members").update({ is_approved: false }).eq("id", id);
    setMembers(
      members.map((m) => (m.id === id ? { ...m, is_approved: false } : m))
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this member?")) return;
    await supabase.from("members").delete().eq("id", id);
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleAwardPoints = async (memberId: string, points: number, reason: string) => {
    const response = await fetch("/api/admin/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, points, reason }),
    });

    if (response.ok) {
      setMembers(
        members.map((m) =>
          m.id === memberId ? { ...m, points: (m.points || 0) + points } : m
        )
      );
    }
  };

  const filteredMembers = members.filter((m) => {
    if (filter === "pending") return !m.is_approved;
    if (filter === "approved") return m.is_approved;
    return true;
  });

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors text-sm"
          >
            ← Back to home
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-neutral-500 text-sm">{user?.email}</span>
            <ThemeToggle />
          </div>
        </div>

        <h1 className="text-2xl font-semibold mb-2">Admin Dashboard</h1>
        <p className="text-neutral-500 mb-8">Manage community members</p>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {(["all", "pending", "approved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                filter === f
                  ? "bg-neutral-700 dark:bg-neutral-200 text-neutral-100 dark:text-neutral-800 border-neutral-600 dark:border-neutral-300"
                  : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" &&
                ` (${members.filter((m) => !m.is_approved).length})`}
            </button>
          ))}
        </div>

        {/* Members List */}
        <div className="space-y-3">
          {filteredMembers.length === 0 ? (
            <p className="text-neutral-400 dark:text-neutral-500">No members found.</p>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.name}</span>
                    <PointsBadge points={member.points || 0} />
                    {member.is_approved ? (
                      <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30 px-2 py-0.5 rounded">
                        Approved
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 px-2 py-0.5 rounded">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="text-neutral-500 text-sm">{member.email}</div>
                  <div className="text-neutral-400 dark:text-neutral-500 text-xs mt-1">
                    /m/{member.slug}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAwardingMember(member)}
                    className="px-3 py-1.5 text-sm border border-amber-300 dark:border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                  >
                    Award Points
                  </button>
                  {member.is_approved ? (
                    <button
                      onClick={() => handleRevoke(member.id)}
                      className="px-3 py-1.5 text-sm border border-amber-300 dark:border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                    >
                      Revoke
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(member.id)}
                      className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 text-white border border-green-500 rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="px-3 py-1.5 text-sm border border-red-300 dark:border-red-500/50 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Invite Link */}
        <div className="mt-12 p-5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl">
          <h3 className="font-medium mb-2">Invite members</h3>
          <p className="text-neutral-500 text-sm mb-3">
            Share this link with people you want to invite:
          </p>
          <code className="block p-3 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm text-neutral-600 dark:text-neutral-300">
            {typeof window !== "undefined" && `${window.location.origin}/join`}
          </code>
        </div>
      </div>

      {/* Award Points Modal */}
      {awardingMember && (
        <AwardPointsModal
          member={awardingMember}
          onClose={() => setAwardingMember(null)}
          onAward={handleAwardPoints}
        />
      )}
    </main>
  );
}
