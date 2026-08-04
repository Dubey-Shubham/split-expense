import { Suspense } from "react";
import { getCurrentUserAction } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/app/components/profile/ProfileForm";
import { ThemeToggle } from "@/app/components/profile/ThemeToggle";
import { InitialsAvatar } from "@/app/components/InitialsAvatar";
import { LogoutButton } from "@/app/components/layout/LogoutButton";
import { Label } from "@/components/ui/label";

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
        </div>
      </div>
      <div className="space-y-6">

        {/* Skeleton Card 1: Avatar and Name */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="absolute top-[-50%] left-[-10%] w-[60%] h-[150%] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />
          <div className="w-24 h-24 rounded-full bg-muted animate-pulse border-4 border-background shadow-lg shrink-0" />
          <div className="flex-1 w-full flex flex-col items-center sm:items-start z-10 pt-2">
            <div className="h-7 bg-muted animate-pulse rounded-md w-48 mb-3" />
            <div className="h-4 bg-muted animate-pulse rounded-md w-32" />
          </div>
        </div>

        {/* Skeleton Card 2: Personal Details */}
        <div className="space-y-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground tracking-tight">Personal Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <div className="h-10 bg-muted animate-pulse rounded-md w-full" />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <div className="h-10 bg-muted animate-pulse rounded-md w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email Address</Label>
            <div className="h-10 bg-muted animate-pulse rounded-md w-full" />
            <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
          </div>
        </div>

        {/* Skeleton Card 3: Additional Info */}
        <div className="space-y-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground tracking-tight">Additional Info</h3>
          <div className="space-y-2">
            <Label>Mobile Number (Optional)</Label>
            <div className="h-10 bg-muted animate-pulse rounded-md w-full" />
          </div>
          <div className="space-y-2">
            <Label>Payment ID (UPI/Venmo) (Optional)</Label>
            <div className="h-10 bg-muted animate-pulse rounded-md w-full" />
          </div>
        </div>

        {/* Skeleton Submit Button */}
        <div className="flex justify-end">
          <div className="h-10 w-36 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    </div>
  );
}

async function ProfileContent() {
  const user = await getCurrentUserAction();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-4 px-4 space-y-6">

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Your Profile</h2>
        <div className="flex items-center gap-3">
          <ThemeToggle />
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
          <div className="mt-4 md:hidden">
            <LogoutButton showText={true} />
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
