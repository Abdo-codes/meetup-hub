"use client";

import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";

export function JoinButton() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Don't render while checking auth
  if (isLoggedIn === null || isLoggedIn) {
    return null;
  }

  return (
    <Link
      href="/join"
      className="inline-block px-4 py-2 bg-neutral-200 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-lg transition-colors text-sm"
    >
      Join as a member →
    </Link>
  );
}
