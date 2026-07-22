import { ArrowRight, Wallet, Users, Receipt } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 text-center space-y-8 mt-12">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-primary shadow-xl ring-1 ring-primary/50">
          <Wallet className="h-12 w-12 text-primary-foreground" />
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Shared Expense Tracker</h1>
        <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
          Manage your personal budget and settle up group expenses effortlessly with UPI.
        </p>
      </div>

      <div className="w-full space-y-4 pt-6 mt-auto">
        <Link 
          href="/groups" 
          className="flex items-center p-4 w-full rounded-2xl bg-card border shadow-sm transition-all hover:shadow-md hover:border-primary/50 group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <Users className="h-5 w-5" />
          </div>
          <div className="ml-4 flex-1 text-left">
            <p className="text-sm font-semibold">Group Expenses</p>
            <p className="text-xs text-muted-foreground">Split bills with friends</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>

        <Link 
          href="/budget" 
          className="flex items-center p-4 w-full rounded-2xl bg-card border shadow-sm transition-all hover:shadow-md hover:border-primary/50 group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-500">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="ml-4 flex-1 text-left">
            <p className="text-sm font-semibold">Personal Budget</p>
            <p className="text-xs text-muted-foreground">Track your daily spending</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </div>
    </div>
  );
}
