import { Suspense } from "react";
import { getCurrentUserAction } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/app/components/profile/ProfileForm";
import { ThemeToggle } from "@/app/components/profile/ThemeToggle";
import { InitialsAvatar } from "@/app/components/InitialsAvatar";
import { LogoutButton } from "@/app/components/layout/LogoutButton";

export const metadata = {
  title: "Profile | Split Expense",
};

function ProfileSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Your Profile</h2>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden sm:block">
            <LogoutButton />
          </div>
        </div>
      </div>
      <div className="h-40 animate-pulse bg-muted rounded-3xl" />
      <div className="h-64 animate-pulse bg-muted rounded-2xl" />
    </div>
  );
}

async function ProfileContent() {
  const user = await getCurrentUserAction();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4 space-y-8">

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Your Profile</h2>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden sm:block">
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="absolute top-[-50%] left-[-10%] w-[60%] h-[150%] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

        <InitialsAvatar
          firstName={user.firstName}
          lastName={user.lastName}
          className="w-24 h-24 text-4xl shadow-lg border-4 border-background"
        />

        <div className="flex-1 text-center sm:text-left z-10">
          <h3 className="text-xl font-bold text-foreground">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
          <div className="mt-4 sm:hidden">
            <LogoutButton />
          </div>
        </div>
      </div>

      <ProfileForm user={user} />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
