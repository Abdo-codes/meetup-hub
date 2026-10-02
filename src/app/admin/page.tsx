"use client";

import { Member } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PointsBadge } from "@/components/PointsBadge";

type MemberFilter = "all" | "pending" | "approved" | "rejected" | "revoked";
type ModerationAction = "approved" | "rejected" | "revoked";

interface AwardModalProps {
  member: Member;
  onClose: () => void;
  onAward: (memberId: string, points: number, reason: string) => Promise<void>;
}

function AwardPointsModal({ member, onClose, onAward }: AwardModalProps) {
  const [points, setPoints] = useState(10);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await onAward(member.id, points, reason);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to award points");
    } finally {
      setIsSubmitting(false);
    }
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

          {errorMessage && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-300">
              {errorMessage}
            </p>
          )}

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
  const [filter, setFilter] = useState<MemberFilter>("all");
  const [awardingMember, setAwardingMember] = useState<Member | null>(null);
  const [rejectingMember, setRejectingMember] = useState<Member | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/admin/members", { cache: "no-store" });
        if (response.status === 401 || response.status === 403) {
          router.push("/");
          return;
        }

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load members");
        }

        setUser({ email: payload.email });
        setMembers(payload.members || []);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load members");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

  const moderateMember = async (id: string, action: ModerationAction, reason?: string) => {
    setActiveMemberId(id);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to update member");
      }

      setMembers((current) =>
        current.map((member) =>
          member.id === id ? { ...member, ...payload.member } : member
        )
      );
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update member");
      return false;
    } finally {
      setActiveMemberId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this member?")) return;
    setActiveMemberId(id);
    setErrorMessage("");
    try {
      const response = await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete member");
      }
      setMembers((current) => current.filter((member) => member.id !== id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete member");
    } finally {
      setActiveMemberId(null);
    }
  };

  const handleReject = async (memberId: string) => {
    if (!rejectionReason.trim()) return;
    if (await moderateMember(memberId, "rejected", rejectionReason)) {
      setRejectionReason("");
      setRejectingMember(null);
    }
  };

  const handleAwardPoints = async (memberId: string, points: number, reason: string) => {
    const response = await fetch("/api/admin/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, points, reason }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to award points");
    }

    setMembers((current) =>
      current.map((m) =>
        m.id === memberId ? { ...m, points: (m.points || 0) + points } : m
      )
    );
  };

  const filteredMembers = members.filter((m) => {
    if (filter === "pending") return !m.is_approved && (!m.status || m.status === "pending");
    if (filter === "approved") return m.is_approved;
    if (filter === "rejected") return m.status === "rejected";
    if (filter === "revoked") return m.status === "revoked";
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
        {errorMessage && (
          <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {errorMessage}
          </p>
        )}

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "pending", "approved", "rejected", "revoked"] as const).map((f) => (
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
                ` (${members.filter((m) => !m.is_approved && (!m.status || m.status === "pending")).length})`}
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
                className="flex flex-col gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.name}</span>
                    <PointsBadge points={member.points || 0} />
                    {member.is_approved ? (
                      <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30 px-2 py-0.5 rounded">
                        Approved
                      </span>
                    ) : member.status === "rejected" ? (
                      <span className="text-xs text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 px-2 py-0.5 rounded">
                        Rejected
                      </span>
                    ) : member.status === "revoked" ? (
                      <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 px-2 py-0.5 rounded">
                        Revoked
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
                  {member.status === "rejected" && member.rejection_reason && (
                    <div className="text-xs text-red-500 mt-1">Rejected: {member.rejection_reason}</div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    onClick={() => setAwardingMember(member)}
                    disabled={activeMemberId === member.id}
                    className="px-3 py-1.5 text-sm border border-amber-300 dark:border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                  >
                    Award Points
                  </button>
                  {member.is_approved ? (
                    <button
                      onClick={() => moderateMember(member.id, "revoked")}
                      disabled={activeMemberId === member.id}
                      className="px-3 py-1.5 text-sm border border-amber-300 dark:border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => moderateMember(member.id, "approved")}
                        disabled={activeMemberId === member.id}
                        className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 text-white border border-green-500 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setRejectingMember(member);
                          setRejectionReason("");
                        }}
                        disabled={activeMemberId === member.id}
                        className="px-3 py-1.5 text-sm border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(member.id)}
                    disabled={activeMemberId === member.id}
                    className="px-3 py-1.5 text-sm border border-red-300 dark:border-red-500/50 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
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

      {rejectingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-member-title"
            className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 w-full max-w-md mx-4 shadow-xl"
          >
            <h2 id="reject-member-title" className="text-lg font-semibold mb-1">Reject member</h2>
            <p className="text-neutral-500 text-sm mb-4">
              Provide a reason for rejecting {rejectingMember.name}
            </p>
            <div className="space-y-4">
              <label htmlFor="rejection-reason" className="block text-sm font-medium">
                Rejection reason
              </label>
              <input
                id="rejection-reason"
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection"
                className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {errorMessage && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-300">
                  {errorMessage}
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setRejectingMember(null)}
                  className="px-4 py-2 text-sm border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(rejectingMember.id)}
                  disabled={!rejectionReason.trim() || activeMemberId === rejectingMember.id}
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {activeMemberId === rejectingMember.id ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
