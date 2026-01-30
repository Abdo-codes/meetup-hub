import Link from "next/link";
import { meetup } from "@/data/meetup";

export function Footer() {
  return (
    <footer className="mt-24 pb-8">
      <div className="max-w-2xl mx-auto px-6">
        <div className="flex items-center justify-center gap-6 text-sm text-neutral-400 dark:text-neutral-500">
          <Link
            href={meetup.links.luma}
            target="_blank"
            className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            Luma
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">·</span>
          <Link
            href={meetup.links.twitter}
            target="_blank"
            className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            Twitter
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">·</span>
          <Link
            href={meetup.links.discord}
            target="_blank"
            className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            Discord
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">·</span>
          <Link
            href={meetup.links.github}
            target="_blank"
            className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
