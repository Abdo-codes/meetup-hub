export default function MemberLoading() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Top bar skeleton */}
        <div className="flex items-center justify-between mb-8 animate-pulse">
          <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="flex gap-2">
            <div className="w-9 h-9 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
            <div className="w-9 h-9 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
          </div>
        </div>

        {/* Profile header skeleton */}
        <header className="mb-12 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 animate-pulse">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-20 h-20 bg-neutral-200 dark:bg-neutral-700 rounded-full shrink-0" />
            <div className="flex-1">
              <div className="h-7 w-40 bg-neutral-200 dark:bg-neutral-700 rounded mb-3" />
              <div className="h-4 w-64 bg-neutral-200 dark:bg-neutral-700 rounded" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-8 w-20 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
            <div className="h-8 w-20 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
          </div>
        </header>

        {/* Projects skeleton */}
        <section className="animate-pulse">
          <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded mb-6" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
              >
                <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg shrink-0" />
                <div className="flex-1">
                  <div className="h-5 w-32 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
                  <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
