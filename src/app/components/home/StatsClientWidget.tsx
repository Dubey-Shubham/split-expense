"use client";

import React, { useState, useTransition } from "react";
import { getUserStatsAction } from "@/app/actions/stats";
import { Loader2, ChevronDown } from "lucide-react";

type Stats = {
  groupsCount: number;
  totalSpent: number;
  avgGroupSpent: number;
  netBalance: number;
};

export function StatsClientWidget({ initialStats }: { initialStats: Stats }) {
  const [stats, setStats] = useState<Stats>(initialStats);
  const [isPending, startTransition] = useTransition();

  const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tf = e.target.value;
    startTransition(async () => {
      const newStats = await getUserStatsAction(tf);
      if (newStats) setStats(newStats);
    });
  };

  const isOwed = stats.netBalance > 0.01;
  const owes = stats.netBalance < -0.01;

  let balanceLabel = "Net Balance";
  let balanceColor = "text-foreground";
  if (isOwed) {
    balanceLabel = "You Are Owed";
    balanceColor = "text-emerald-500";
  } else if (owes) {
    balanceLabel = "You Owe";
    balanceColor = "text-orange-500";
  }

  const formatMoney = (amount: number) => {
    if (!amount && amount !== 0) return "—";
    return `₹${Math.abs(amount).toFixed(2)}`;
  };

  const statCards = [
    { label: "Groups Joined", value: stats.groupsCount.toString(), color: "text-blue-500" },
    { label: "Total Spent", value: formatMoney(stats.totalSpent), color: "text-purple-500" },
    { label: "Avg Group Spent", value: formatMoney(stats.avgGroupSpent), color: "text-indigo-500" },
    { label: balanceLabel, value: formatMoney(stats.netBalance), color: balanceColor },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between pl-1">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          Your Insights
          {isPending && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        </h3>
        
        <div className="relative inline-flex">
          <select
            onChange={handleTimeframeChange}
            disabled={isPending}
            className="appearance-none text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full pl-3 pr-8 py-1.5 outline-none cursor-pointer hover:bg-primary/15 hover:border-primary/30 focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all duration-200"
            defaultValue="max"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="1w">Last 7 Days</option>
            <option value="1m">Last 1 Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="9m">Last 9 Months</option>
            <option value="1y">Last 1 Year</option>
            <option value="max">Lifetime (Max)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-primary">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-2 gap-4 md:grid-cols-4 transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <span className="text-xs font-medium text-muted-foreground">
              {stat.label}
            </span>
            <span className={`text-2xl font-black ${stat.color}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
