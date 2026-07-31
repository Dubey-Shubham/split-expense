import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Sparkles, Users, Home, Plane, Utensils, Beer, Wallet } from "lucide-react";
import { CreateGroupModal } from "@/app/components/groups/CreateGroupModal";
import { DeleteGroupButton } from "@/app/components/groups/DeleteGroupButton";
import { getGroupsForUser } from "@/lib/data/groups";

export const metadata = {
  title: "Group Expenses | Splitwise Lite",
  description: "Track shared expenditures, trip bills, and settle balances with friends.",
};

// ── Static helpers ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "home", label: "Household / Rent", icon: Home },
  { value: "trip", label: "Travel / Trip", icon: Plane },
  { value: "food", label: "Dining / Food", icon: Utensils },
  { value: "party", label: "Night out / Drinks", icon: Beer },
  { value: "other", label: "Other splits", icon: Wallet },
];

function getCategoryIcon(category: string) {
  const matched = CATEGORIES.find((c) => c.value === category);
  const Icon = matched ? matched.icon : Wallet;
  return <Icon className="h-6 w-6" />;
}

function getGroupBalance(groupName: string) {
  const nameLower = groupName.toLowerCase();
  if (nameLower.includes("flatmate") || nameLower.includes("room") || nameLower.includes("rent")) {
    return { status: "owe", text: "You owe", amount: 4300.35, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" };
  }
  if (nameLower.includes("trip") || nameLower.includes("goa") || nameLower.includes("travel")) {
    return { status: "owed", text: "You are owed", amount: 2100.00, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
  }
  return { status: "settled", text: "Settled up", amount: 0, color: "text-muted-foreground bg-muted/30 border-border" };
}

function calculateSummaries(groups: { name: string }[]) {
  let youOwe = 0;
  let youAreOwed = 0;
  groups.forEach((g) => {
    const balance = getGroupBalance(g.name);
    if (balance.status === "owe") youOwe += balance.amount;
    if (balance.status === "owed") youAreOwed += balance.amount;
  });
  return { owe: youOwe, owed: youAreOwed, net: youAreOwed - youOwe };
}

async function LedgerAmounts() {
  // await new Promise((resolve) => setTimeout(resolve, 2000));
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_user")?.value;
  if (!userId) redirect("/login");

  const groups = await getGroupsForUser(userId);
  const summaries = calculateSummaries(groups);

  return (
    <>
      <div className="flex flex-col space-y-1 justify-center sm:pr-4">
        <span className="text-xs font-medium text-muted-foreground">You are owed</span>
        <span className="text-2xl font-black text-emerald-500">
          ₹{summaries.owed.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div className="flex flex-col space-y-1 justify-center pt-4 sm:pt-0 sm:px-6">
        <span className="text-xs font-medium text-muted-foreground">You owe</span>
        <span className="text-2xl font-black text-orange-500">
          ₹{summaries.owe.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div className="flex flex-col space-y-1 justify-center pt-4 sm:pt-0 sm:pl-6">
        <span className="text-xs font-medium text-muted-foreground">Net balance</span>
        <span className={`text-2xl font-black ${summaries.net >= 0 ? "text-emerald-500" : "text-orange-500"}`}>
          {summaries.net >= 0 ? "+" : ""}₹{summaries.net.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      </div>
    </>
  );
}

function LedgerAmountsSkeleton() {
  return (
    <>
      <div className="flex flex-col space-y-1 justify-center sm:pr-4">
        <span className="text-xs font-medium text-muted-foreground">You are owed</span>
        <div className="h-8 w-24 bg-muted animate-pulse rounded-lg mt-1" />
      </div>
      <div className="flex flex-col space-y-1 justify-center pt-4 sm:pt-0 sm:px-6">
        <span className="text-xs font-medium text-muted-foreground">You owe</span>
        <div className="h-8 w-24 bg-muted animate-pulse rounded-lg mt-1" />
      </div>
      <div className="flex flex-col space-y-1 justify-center pt-4 sm:pt-0 sm:pl-6">
        <span className="text-xs font-medium text-muted-foreground">Net balance</span>
        <div className="h-8 w-24 bg-muted animate-pulse rounded-lg mt-1" />
      </div>
    </>
  );
}

async function GroupsGrid() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_user")?.value;
  if (!userId) redirect("/login");

  const groups = await getGroupsForUser(userId);

  if (groups.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 border flex items-center justify-center text-muted-foreground">
          <Users className="h-8 w-8" />
        </div>
        <div className="space-y-1.5">
          <h4 className="font-bold text-foreground">No groups yet</h4>
          <p className="text-sm text-muted-foreground max-w-[280px]">
            Create your first group to start splitting bills and settling balances with friends.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {groups.map((group) => {
        const balance = getGroupBalance(group.name);
        const isCreator = group.createdBy === userId;

        return (
          <div
            key={group.id}
            className="bg-card border border-border hover:border-primary/30 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group/card relative overflow-hidden cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                  {getCategoryIcon(group.avatar)}
                </div>
                <div>
                  <h4 className="font-bold text-foreground group-hover/card:text-primary transition-colors pr-6">
                    {group.name}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {group.description || "No description provided."}
                  </p>
                </div>
              </div>
              {isCreator && <DeleteGroupButton groupId={group.id} />}
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-4 mt-5">
              <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{group.memberCount} members</span>
              </div>
              <div className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${balance.color}`}>
                {balance.text} {balance.amount > 0 ? `₹${balance.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GroupsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-3xl p-5 shadow-sm flex flex-col justify-between h-[150px]">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-2xl bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
                <div className="h-3 w-40 bg-muted animate-pulse rounded-md" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-4 mt-5">
            <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-6 w-24 bg-muted animate-pulse rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}


export default function GroupsPage() {
  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto py-6 px-2">

      <div className="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-[-40%] right-[-10%] w-[50%] h-[120%] rounded-full bg-primary/5 blur-[70px] pointer-events-none" />

        <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span>Quick Summary Ledger</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <Suspense fallback={<LedgerAmountsSkeleton />}>
            <LedgerAmounts />
          </Suspense>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Group Expenses</h2>
          <p className="text-sm text-muted-foreground">Split bills, track logs, and settle up balances</p>
        </div>
        <CreateGroupModal />
      </div>

      <Suspense fallback={<GroupsGridSkeleton />}>
        <GroupsGrid />
      </Suspense>
    </div>
  );
}
