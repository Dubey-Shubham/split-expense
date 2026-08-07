import { Suspense } from "react";
import { getCurrentUserAction } from "@/app/actions/auth";
import { getGroupDetails } from "@/lib/data/groups";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, MessageCircle, Wallet, Calculator, HelpCircle, ChevronRight, Copy, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddMemberDialog } from "@/app/components/groups/AddMemberDialog";
import { CopyGroupLinkButton } from "@/app/components/groups/CopyGroupLinkButton";

// We need an exact match for group params type in Next.js 16 dynamic routes
interface GroupPageProps {
  params: Promise<{ groupId: string }>;
}

export const metadata = {
  title: "Group Details | Split Expense",
};

// --- Sub-components for better organization ---

function GroupHeader({ group }: { group: any }) {
  // A simple mapping for avatars based on the group's "avatar" string
  const getAvatarIcon = (type: string) => {
    switch (type) {
      case "home": return "🏠";
      case "trip": return "✈️";
      case "food": return "🍔";
      case "party": return "🎉";
      default: return "📦";
    }
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm flex items-center gap-4 sm:gap-6 relative overflow-hidden">
      <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[150%] rounded-full bg-primary/5 blur-[60px] pointer-events-none" />

      {/* Group Avatar */}
      <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-muted text-3xl sm:text-4xl shadow-inner border border-border/50">
        {getAvatarIcon(group.avatar)}
      </div>

      {/* Group Info */}
      <div className="flex-1 min-w-0">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">{group.name}</h2>
        {group.description && (
          <p className="text-sm text-muted-foreground mt-1 truncate">{group.description}</p>
        )}
      </div>

      {/* Members Dialog Trigger */}
      {group.members.length > 1 && (
        <Dialog>
          <DialogTrigger className="flex flex-col items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0">
            <span className="text-xl sm:text-2xl font-black">{group.members.length}</span>
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Members</span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Group Members</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
              {group.members.map((member: any) => (
                <div key={member.id} className="flex items-center gap-3 bg-muted/30 p-3 rounded-2xl border border-border/50">
                  <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{member.firstName} {member.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// --- Main Page Component ---

async function GroupContent({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const user = await getCurrentUserAction();
  if (!user) {
    redirect("/login");
  }

  const group = await getGroupDetails(groupId, user.id);

  // If the group doesn't exist or the user is not a member, kick them back
  if (!group) {
    redirect("/groups");
  }

  return (
    <div className="space-y-6">
      <GroupHeader group={group} />

      {group.members.length === 1 ? (
        <div className="mt-6 bg-card border border-border rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Users className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">You are the only one here!</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-8">
            Start by adding your friends to this group to track expenses, settle debts, and chat.
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <AddMemberDialog groupId={group.id} />
            <CopyGroupLinkButton groupId={group.id} />
          </div>
        </div>
      ) : (
        <>

          <Tabs defaultValue="messages" className="w-full">
            <TabsList className="flex w-full rounded-2xl bg-card border border-border p-1 !h-auto gap-1 shadow-sm">
              <TabsTrigger value="settle" className="flex-1 rounded-xl py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col gap-1 h-auto">
                <Wallet className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs font-medium">Settle</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex-1 rounded-xl py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col gap-1 h-auto">
                <MessageCircle className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs font-medium">Messages</span>
              </TabsTrigger>
              <TabsTrigger value="balances" className="flex-1 rounded-xl py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col gap-1 h-auto">
                <HelpCircle className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs font-medium">Balances</span>
              </TabsTrigger>
              <TabsTrigger value="totals" className="flex-1 rounded-xl py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col gap-1 h-auto">
                <Calculator className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs font-medium">Totals</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 bg-card border border-border rounded-3xl p-6 min-h-[300px] shadow-sm flex items-center justify-center">
              <TabsContent value="settle" className="m-0 text-center text-muted-foreground w-full">
                Settle Sub-section (Coming Soon)
              </TabsContent>
              <TabsContent value="messages" className="m-0 text-center text-muted-foreground w-full">
                Messages Sub-section (Coming Soon)
              </TabsContent>
              <TabsContent value="balances" className="m-0 text-center text-muted-foreground w-full">
                Balances Sub-section (Coming Soon)
              </TabsContent>
              <TabsContent value="totals" className="m-0 text-center text-muted-foreground w-full">
                Totals Sub-section (Coming Soon)
              </TabsContent>
            </div>
          </Tabs>
        </>
      )}
    </div>
  );
}

function GroupSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm flex items-center gap-4 sm:gap-6 relative overflow-hidden">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-muted animate-pulse shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-1/3 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-1/2 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-muted animate-pulse shrink-0" />
      </div>

      <div className="h-[72px] bg-card border border-border rounded-2xl animate-pulse" />
      <div className="h-[300px] bg-card border border-border rounded-3xl animate-pulse mt-6" />
    </div>
  );
}

export default function GroupPage({ params }: GroupPageProps) {
  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Static Header Nav */}
      <div className="flex items-center">
        <Link href="/groups" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Groups
        </Link>
      </div>

      <Suspense fallback={<GroupSkeleton />}>
        <GroupContent params={params} />
      </Suspense>
    </div>
  );
}
