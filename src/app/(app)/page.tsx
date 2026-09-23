import { Suspense } from "react";
import { ArrowRight, Users, Receipt, PieChart, MessageSquare, QrCode } from "lucide-react";
import Link from "next/link";
import { WelcomeCard } from "@/app/components/home/WelcomeCard";
import { getCurrentUserAction } from "@/app/actions/auth";
import { getUserStatsAction } from "@/app/actions/stats";
import { StatsClientWidget } from "@/app/components/home/StatsClientWidget";

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-[90px] rounded-2xl bg-muted/60" />
      ))}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 md:space-y-10 py-4 md:py-6 px-2">
      <WelcomeCard />
      <QuickActionsSection />
      <StatsSkeleton />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

function QuickActionsSection() {
  return (
    <section>
      <h3 className="mb-4 pl-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Quick Actions
      </h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/groups"
          className="group flex items-center gap-5 rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:border-blue-500/40 hover:shadow-md hover:shadow-blue-500/5"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-500 transition-colors group-hover:bg-blue-500/15">
            <Users className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Group Expenses</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Split bills with roommates or friends on trips
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-blue-500" />
        </Link>

        {/* Temporarily hidden - Backlog Feature
        <Link
          href="/budget"
          className="group flex items-center gap-5 rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-500/5"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 transition-colors group-hover:bg-emerald-500/15">
            <Receipt className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Personal Budget</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Track and manage your daily spending budgets
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-emerald-500" />
        </Link>
        */}
      </div>
    </section>
  );
}

// Old StatsSection removed, replaced by StatsClientWidget

async function HomeContent() {
  const user = await getCurrentUserAction();
  const stats = await getUserStatsAction();

  if (!user) {
    // Unauthenticated Landing Page view (Marketing & Features)
    return (
      <div className="relative flex flex-col items-center justify-center w-full min-h-[80dvh] py-12 md:py-20 overflow-hidden">
        {/* Glow backgrounds */}
        <div className="absolute top-[10%] left-[-15%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-15%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

        {/* Hero Header */}
        <div className="text-center space-y-6 max-w-3xl z-10 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary animate-pulse">
            <span>Track and Split Seamlessly</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-foreground">
            Track Expenses, <br className="hidden sm:inline" />
            Manage Budgets
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            The ultimate personal ledger and group sharing platform. Split travel bills, coordinate budgets with friends, and settle balances instantly via UPI.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3.5 rounded-full transition-all duration-300 active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 group text-sm"
            >
              <span>Get Started for Free</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto bg-muted hover:bg-muted/80 text-foreground font-semibold px-8 py-3.5 rounded-full border border-border transition-all duration-300 active:scale-[0.98] text-center text-sm"
            >
              Already a member? Log In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full px-4 pt-20 md:pt-32 z-10">
          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <PieChart className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-base">Personal Budget</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Log your daily private transactions, set budget targets, and organize your money by categories.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-base">Shared Groups</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Create groups for roommates, travel, or dining out. Split expenses equally, by exact amount, or percent.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-500 border border-green-500/20">
              <QrCode className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-base">UPI Settle Up</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Clear balances inside the app by generating pre-filled payment QR codes that open directly in any UPI app.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-base">Group Chat</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Discuss expenses, upload receipts, and stay aligned with group members through contextual chat panels.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 md:space-y-10 py-4 md:py-6 px-2">
      <WelcomeCard />
      <QuickActionsSection />
      {stats && <StatsClientWidget initialStats={stats} />}
    </div>
  );
}
