"use client";

interface PointsBadgeProps {
  points: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function PointsBadge({
  points,
  size = "sm",
  showLabel = false,
}: PointsBadgeProps) {
  // Determine tier based on points
  const getTier = () => {
    if (points >= 200) return "gold";
    if (points >= 50) return "silver";
    return "bronze";
  };

  const tier = getTier();

  // Tier-based styles
  const tierStyles = {
    bronze: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/50",
    silver: "bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600/50",
    gold: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600/50",
  };

  const sizeStyles = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-sm",
    lg: "px-3 py-1.5 text-base font-medium",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${tierStyles[tier]} ${sizeStyles[size]}`}
      title={`${points} points (${tier})`}
    >
      <svg
        className={`${size === "sm" ? "w-3 h-3" : size === "md" ? "w-3.5 h-3.5" : "w-4 h-4"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      {points}
      {showLabel && <span className="ml-0.5">pts</span>}
    </span>
  );
}
