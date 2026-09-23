import { Suspense } from "react";
import { cookies } from "next/headers";
import { HandCoins, TrendingUp } from "lucide-react";
import { getUserProfile } from "@/lib/data/users";

async function UserNameText() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_user")?.value;
  if (!userId) return <span className="text-2xl font-extrabold tracking-tight text-foreground">Guest <span className="inline-block">👋</span></span>;

  const user = await getUserProfile(userId);
  if (!user) return <span className="text-2xl font-extrabold tracking-tight text-foreground">User <span className="inline-block">👋</span></span>;

  return (
    <span className="text-2xl font-extrabold tracking-tight text-foreground">
      {user.firstName} {user.lastName} <span className="inline-block">👋</span>
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

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-xl md:p-8">
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-blue-500/6 blur-2xl" />

      <div className="relative flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm mt-1 sm:mt-0">
            <HandCoins className="h-7 w-7" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Welcome Back
            </p>
            <h2 className="mt-0.5 leading-tight">
              <Suspense fallback={<UserNameSkeleton />}>
                <UserNameText />
              </Suspense>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Here&apos;s your financial overview for today.
            </p>
          </div>
        </div>

        <div className="absolute top-0 right-0 sm:relative sm:top-auto sm:right-auto shrink-0 flex-col items-end gap-1 flex">
          <div className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-3 w-3" />
            <span className="hidden sm:inline">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
