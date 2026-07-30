export function WelcomeCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 shrink-0 animate-pulse rounded-2xl bg-muted" />

          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-7 w-48 animate-pulse rounded-xl bg-muted" />
            <div className="h-3.5 w-56 animate-pulse rounded-full bg-muted" />
          </div>
        </div>

        <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
          <div className="h-7 w-28 animate-pulse rounded-full bg-muted" />
          <div className="h-7 w-20 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
