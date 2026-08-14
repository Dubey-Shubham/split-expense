"use client";

import React from "react";
import { Home, Plane, Utensils, Beer, Wallet, Receipt } from "lucide-react";

export function GroupExpensesFeed({ expenses, currentUserId }: { expenses: any[], currentUserId: string }) {
  // Group by Month Year
  const grouped = expenses.reduce((acc, expense) => {
    const date = new Date(expense.createdAt);
    const monthYear = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(expense);
    return acc;
  }, {} as Record<string, any[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "home": return <Home className="h-5 w-5" />;
      case "trip": return <Plane className="h-5 w-5" />;
      case "food": return <Utensils className="h-5 w-5" />;
      case "party": return <Beer className="h-5 w-5" />;
      default: return <Receipt className="h-5 w-5" />;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Add Expense Button Placeholder */}
      <div className="flex justify-between items-center bg-card p-4 sm:p-5 rounded-3xl border border-border shadow-sm">
        <h3 className="font-bold text-foreground sm:text-lg">Group Expenses</h3>
        <button 
          onClick={() => alert("Add Expense Popup Coming Soon!")}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition-colors"
        >
          Add Expense
        </button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-3xl border border-border/50">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <p className="text-foreground text-lg font-bold">No expenses here yet.</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Add an expense to start tracking and settling up with your friends!
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([monthYear, monthExpenses]) => (
          <div key={monthYear} className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-2">{monthYear}</h4>
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm divide-y divide-border/50">
              {monthExpenses.map((expense) => {
                const date = new Date(expense.createdAt);
                const day = new Intl.DateTimeFormat("en-US", { day: "2-digit" }).format(date);
                const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
                
                // Calculate balance logic
                const userSplit = expense.splits.find((s: any) => s.userId === currentUserId);
                const iPaid = expense.paidById === currentUserId;
                const totalAmount = parseFloat(expense.amount);
                
                let balanceText = "Not involved";
                let balanceAmount = "";
                let balanceColor = "text-muted-foreground";

                if (iPaid) {
                  const myOwed = userSplit ? parseFloat(userSplit.amountOwed) : 0;
                  const lentAmount = totalAmount - myOwed;
                  if (lentAmount > 0) {
                    balanceText = "you lent";
                    balanceAmount = `₹${lentAmount.toFixed(2)}`;
                    balanceColor = "text-emerald-500";
                  } else {
                    balanceText = "you paid for yourself";
                  }
                } else if (userSplit) {
                  const borrowedAmount = parseFloat(userSplit.amountOwed);
                  balanceText = "you borrowed";
                  balanceAmount = `₹${borrowedAmount.toFixed(2)}`;
                  balanceColor = "text-orange-500";
                }

                return (
                  <div key={expense.id} className="flex items-center gap-3 sm:gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer group">
                    <div className="flex flex-col items-center justify-center min-w-[2.5rem] sm:min-w-[3rem] text-center">
                      <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase">{month}</span>
                      <span className="text-lg sm:text-xl font-black text-foreground leading-none">{day}</span>
                    </div>

                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
                      {getCategoryIcon(expense.category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground text-sm sm:text-base truncate group-hover:text-primary transition-colors">{expense.description}</h4>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">
                        <span className="font-semibold text-foreground/80">{iPaid ? "You" : expense.paidByFirstName}</span> paid <span className="font-semibold text-foreground/80">₹{totalAmount.toFixed(2)}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-center shrink-0 text-right min-w-[4rem] sm:min-w-[5rem]">
                      <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${balanceColor}`}>{balanceText}</span>
                      {balanceAmount && <span className={`text-sm sm:text-base font-black ${balanceColor}`}>{balanceAmount}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
