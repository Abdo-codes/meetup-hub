import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center px-6">
        <h1 className="text-6xl font-bold text-neutral-300 dark:text-neutral-700 mb-4">
          404
        </h1>
        <h2 className="text-xl font-semibold mb-2">Page not found</h2>
        <p className="text-neutral-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-neutral-200 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-lg transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
