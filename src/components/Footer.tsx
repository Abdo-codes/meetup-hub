import Link from "next/link";
import { meetup } from "@/data/meetup";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-16">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-neutral-500">
            © {currentYear} {meetup.name}
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href={meetup.links.luma}
              target="_blank"
              className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              Luma
            </Link>
            <Link
              href={meetup.links.twitter}
              target="_blank"
              className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              Twitter
            </Link>
            <Link
              href={meetup.links.discord}
              target="_blank"
              className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              Discord
            </Link>
            <Link
              href={meetup.links.github}
              target="_blank"
              className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
