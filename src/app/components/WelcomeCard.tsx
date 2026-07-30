import { Suspense } from "react";
import { cookies } from "next/headers";
import { Sparkles, TrendingUp, Calendar } from "lucide-react";
import { getUserProfile } from "@/lib/data/users";

async function UserNameText() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_user")?.value;
  if (!userId) return <span className="text-2xl font-extrabold tracking-tight text-foreground">Guest 👋</span>;

  const user = await getUserProfile(userId);
  if (!user) return <span className="text-2xl font-extrabold tracking-tight text-foreground">User 👋</span>;

  return (
    <span className="text-2xl font-extrabold tracking-tight text-foreground">
      {user.firstName} {user.lastName} 👋
    </span>
  );
}

function UserNameSkeleton() {
  return <div className="h-7 w-44 bg-muted animate-pulse rounded-md my-0.5 inline-block" />;
}

/**
 * WelcomeCard
 *
 * The card shell (border, icons, greeting, calendar, active badge) is 100% static.
 * Only the username is dynamic and streams in via a precise <Suspense> boundary around the text.
 */
export function WelcomeCard() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8">
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-blue-500/6 blur-2xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
            <Sparkles className="h-7 w-7" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {greeting}
            </p>
            <h2 className="mt-0.5 flex items-center">
              <Suspense fallback={<UserNameSkeleton />}>
                <UserNameText />
              </Suspense>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Here&apos;s your financial overview for today.
            </p>
          </div>
        </div>

        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-3 w-3" />
            <span>Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
