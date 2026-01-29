export default function Loading() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header skeleton */}
        <header className="mb-16 animate-pulse">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="h-9 w-64 bg-neutral-200 dark:bg-neutral-700 rounded-lg mb-3" />
              <div className="h-5 w-48 bg-neutral-200 dark:bg-neutral-700 rounded mb-4" />
            </div>
            <div className="w-9 h-9 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
          </div>
          <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
          <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </header>

        {/* Events skeleton */}
        <section className="mb-16 animate-pulse">
          <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
              >
                <div className="flex justify-between">
                  <div>
                    <div className="h-5 w-40 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
                    <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded" />
                  </div>
                  <div className="text-right">
                    <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded mb-1" />
                    <div className="h-4 w-12 bg-neutral-200 dark:bg-neutral-700 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Projects skeleton */}
        <section className="mb-16 animate-pulse">
          <div className="h-4 w-28 bg-neutral-200 dark:bg-neutral-700 rounded mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
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

        {/* Members skeleton */}
        <section className="animate-pulse">
          <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
              >
                <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="h-5 w-28 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
                  <div className="h-4 w-40 bg-neutral-200 dark:bg-neutral-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
