import { ArrowRight, Users, Receipt, PieChart, MessageSquare, QrCode, Sparkles } from "lucide-react";
import Link from "next/link";
import { getCurrentUserAction } from "@/app/actions/auth";

export default async function Home() {
  const user = await getCurrentUserAction();

  if (user) {
    // Authenticated Dashboard view
    return (
      <div className="flex flex-col max-w-2xl mx-auto w-full p-4 md:p-6 space-y-8 mt-6">
        {/* Welcome message */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[80%] rounded-full bg-primary/5 blur-[50px] pointer-events-none" />
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Welcome back</p>
              <h2 className="text-xl font-bold text-foreground">Hello, {user.firstName}!</h2>
            </div>
          </div>
        </div>

        {/* Dashboard Grid options */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4">
            <Link
              href="/groups"
              className="flex items-center p-5 w-full rounded-3xl bg-card border border-border shadow transition-all hover:shadow-lg hover:border-primary/50 group"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Users className="h-6 w-6" />
              </div>
              <div className="ml-4 flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">Group Expenses</p>
                <p className="text-xs text-muted-foreground">Split bills with roommates or friends on trips</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href="/budget"
              className="flex items-center p-5 w-full rounded-3xl bg-card border border-border shadow transition-all hover:shadow-lg hover:border-primary/50 group"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-500/10 text-green-500 border border-green-500/20">
                <Receipt className="h-6 w-6" />
              </div>
              <div className="ml-4 flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">Personal Budget</p>
                <p className="text-xs text-muted-foreground">Track and manage your daily spending budgets</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
