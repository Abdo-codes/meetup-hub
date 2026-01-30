"use client";

import { createClient } from "@/lib/supabase";
import { Member } from "@/lib/types";
import { getGravatarUrl } from "@/lib/gravatar";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PointsBadge } from "./PointsBadge";

const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || [];

export function UserBar() {
  const [member, setMember] = useState<Member | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      setUserEmail(user.email || null);

      // Check if admin
      const isLocalDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      setIsAdmin(isLocalDev || ADMIN_EMAILS.includes(user.email || ""));

      // Get OAuth avatar
      const oauthAvatar =
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        getGravatarUrl(user.email!);
      setAvatarUrl(oauthAvatar);

      // Get member profile
      const { data: memberData } = await supabase
        .from("members")
        .select("*")
        .eq("email", user.email)
        .single();

      if (memberData) {
        setMember(memberData);
        if (memberData.image_url) {
          setAvatarUrl(memberData.image_url);
        }
      }

      setIsLoading(false);
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setMember(null);
        setUserEmail(null);
        setAvatarUrl(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Don't render anything while loading or if not logged in
  if (isLoading || !userEmail) {
    return null;
  }

  const displayName = member?.name || userEmail.split("@")[0];
  const profileUrl = member?.slug ? `/m/${member.slug}` : "/dashboard";

  return (
    <>
      {/* Spacer to push content below fixed bar */}
      <div className="h-12" />

      {/* Fixed top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          {/* Left: Logo/Home link */}
          <Link
            href="/"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Amsterdam AI Builders
          </Link>

          {/* Right: User info */}
          <div className="flex items-center gap-2">
            {/* Admin link */}
            {isAdmin && (
              <Link
                href="/admin"
                className="px-2 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
              >
                Admin
              </Link>
            )}

            {/* Dashboard link */}
            <Link
              href="/dashboard"
              className="px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              Dashboard
            </Link>

            {/* Points */}
            {member && <PointsBadge points={member.points || 0} size="sm" />}

            {/* Profile link with avatar and name */}
            <Link
              href={profileUrl}
              className="flex items-center gap-2 px-2 py-1 -my-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="View your profile"
            >
              {avatarUrl && (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                />
              )}
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 max-w-[120px] truncate">
                {displayName}
              </span>
            </Link>

            {/* Logout button */}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              className="px-2 py-1 text-xs text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Sign out"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
