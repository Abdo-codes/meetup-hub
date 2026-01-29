"use client";

import { Project } from "@/lib/types";
import { useState } from "react";

interface ProjectCardProps {
  project: Project & { member?: { name: string; slug: string } };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [votes, setVotes] = useState(project.monthly_votes ?? 0);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async () => {
    // Track click in background
    fetch(`/api/projects/${project.id}/click`, { method: "POST" });
  };

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasVoted || isVoting) return;

    setIsVoting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/vote`, {
        method: "POST",
      });

      if (res.ok) {
        setIsAnimating(true);
        setVotes((v) => v + 1);
        setHasVoted(true);
        setTimeout(() => setIsAnimating(false), 300);
      } else {
        const data = await res.json();
        if (data.error === "Already voted") {
          setHasVoted(true);
        }
      }
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors group">
      <button
        onClick={handleVote}
        disabled={hasVoted || isVoting}
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border transition-all duration-200 shrink-0 ${
          isAnimating ? "scale-110" : "scale-100"
        } ${
          hasVoted
            ? "border-amber-400 dark:border-amber-500 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
            : "border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 active:scale-95"
        }`}
      >
        <svg
          className="w-4 h-4"
          fill={hasVoted ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
        <span className="text-xs font-medium">{votes}</span>
      </button>

      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="flex-1 min-w-0"
      >
        <div className="font-medium group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {project.title}
          <span className="opacity-0 group-hover:opacity-100 ml-1 transition-opacity">
            ↗
          </span>
        </div>
        {project.description && (
          <p className="text-neutral-500 text-sm truncate">
            {project.description}
          </p>
        )}
        {project.member && (
          <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-0.5">
            by {project.member.name}
          </p>
        )}
      </a>

      {project.clicks > 0 && (
        <span className="text-neutral-400 dark:text-neutral-500 text-xs shrink-0">
          {project.clicks} clicks
        </span>
      )}
    </div>
  );
}
