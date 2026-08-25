"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function GroupBalances({ group, expenses, currentUserId }: { group: any, expenses: any[], currentUserId: string }) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Calculate balances for each member
  const memberBalances = group.members.map((member: any) => {
    let totalPaid = 0;
    let totalShare = 0;
    const involvedExpenses: any[] = [];

    expenses.forEach((expense: any) => {
      const iPaid = expense.paidById === member.id;
      const mySplit = expense.splits.find((s: any) => s.userId === member.id);
      
      let involved = false;
      let lentAmount = 0;
      let borrowedAmount = 0;

      if (iPaid) {
        const totalAmount = parseFloat(expense.amount);
        const myOwed = mySplit ? parseFloat(mySplit.amountOwed) : 0;
        lentAmount = totalAmount - myOwed;
        totalPaid += totalAmount;
        if (lentAmount > 0) involved = true;
      }
      
      if (mySplit) {
        totalShare += parseFloat(mySplit.amountOwed);
        if (!iPaid) {
          borrowedAmount = parseFloat(mySplit.amountOwed);
          involved = true;
        }
      }

      if (involved) {
        involvedExpenses.push({
          expense,
          lentAmount,
          borrowedAmount,
        });
      }
    });

    const netBalance = totalPaid - totalShare;

    return {
      ...member,
      netBalance,
      involvedExpenses
    };
  });

  // Sort so currentUserId is first, then by netBalance (descending)
  const sortedBalances = [...memberBalances].sort((a, b) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return b.netBalance - a.netBalance; // High balances (getting back) first
  });

  return (
    <div className="relative w-full flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-lg font-bold text-foreground ml-2">Balances</h3>
      </div>
      <div className="w-full space-y-4 overflow-y-auto custom-scrollbar pr-1 pb-4 flex-1 min-h-0">
      {sortedBalances.map((member) => {
        const isMe = member.id === currentUserId;
        const displayName = isMe ? "You" : `${member.firstName} ${member.lastName}`;
        const isExpanded = expandedUserId === member.id;
        
        let statusText = "are settled up";
        let statusColor = "text-muted-foreground";
        let amountText = "";

        if (member.netBalance > 0.01) {
          statusText = isMe ? "get back in total" : "gets back in total";
          statusColor = "text-emerald-500";
          amountText = `₹${member.netBalance.toFixed(2)}`;
        } else if (member.netBalance < -0.01) {
          statusText = isMe ? "owe in total" : "owes in total";
          statusColor = "text-orange-500";
          amountText = `₹${Math.abs(member.netBalance).toFixed(2)}`;
        }

        return (
          <div key={member.id} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            {/* Main Row */}
            <div 
              onClick={() => setExpandedUserId(isExpanded ? null : member.id)}
              className="flex items-center gap-4 p-5 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-foreground text-base sm:text-lg">{displayName}</h4>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xs sm:text-sm text-muted-foreground">{statusText}</span>
                  {amountText && <span className={`font-black text-sm sm:text-base ${statusColor}`}>{amountText}</span>}
                </div>
              </div>
              
              <div className="shrink-0 text-muted-foreground">
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="bg-muted/20 border-t border-border/50 p-5 px-6 sm:px-8 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Transaction History</h5>
                
                {member.involvedExpenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center italic py-2">No active expenses for this user.</p>
                ) : (
                  <div className="space-y-3 divide-y divide-border/50">
                    {member.involvedExpenses.map(({ expense, lentAmount, borrowedAmount }: any) => {
                      const isLent = lentAmount > 0;
                      return (
                        <div key={expense.id} className="flex items-center justify-between pt-3 first:pt-0 text-sm">
                          <div className="flex flex-col min-w-0 pr-4">
                            <span className="font-semibold text-foreground truncate">{expense.description}</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                              {isLent ? (isMe ? 'You paid and lent' : `${member.firstName} paid and lent`) : (isMe ? 'You borrowed' : `${member.firstName} borrowed`)}
                            </span>
                          </div>
                          <span className={`font-black whitespace-nowrap ${isLent ? 'text-emerald-500' : 'text-orange-500'}`}>
                            {isLent ? '+' : '-'}₹{(isLent ? lentAmount : borrowedAmount).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
