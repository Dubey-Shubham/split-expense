"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PayNowButton } from "./PayNowButton";

export function GroupBalances({ group, expenses, currentUserId }: { group: any, expenses: any[], currentUserId: string }) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [expandedPairId, setExpandedPairId] = useState<string | null>(null);

  const togglePair = (e: React.MouseEvent, pairId: string) => {
    e.stopPropagation();
    setExpandedPairId(prev => prev === pairId ? null : pairId);
  };

  const getTransactionsBetween = (userA: string, userB: string) => {
    const txs: any[] = [];
    expenses.forEach((expense: any) => {
      if (expense.paidById === userA) {
        const split = expense.splits.find((s: any) => s.userId === userB);
        if (split) {
          const payerIsMe = userA === currentUserId;
          const userAObj = group.members.find((m: any) => m.id === userA);
          txs.push({
            expense,
            amount: parseFloat(split.amountOwed),
            isLent: true, 
            payerName: payerIsMe ? "You" : userAObj?.firstName || "Someone",
          });
        }
      } else if (expense.paidById === userB) {
        const split = expense.splits.find((s: any) => s.userId === userA);
        if (split) {
          const payerIsMe = userB === currentUserId;
          const userBObj = group.members.find((m: any) => m.id === userB);
          txs.push({
            expense,
            amount: parseFloat(split.amountOwed),
            isLent: false, 
            payerName: payerIsMe ? "You" : userBObj?.firstName || "Someone",
          });
        }
      }
    });
    return txs.sort((a, b) => new Date(b.expense.createdAt).getTime() - new Date(a.expense.createdAt).getTime());
  };

  // 1. Calculate pairwise balances: balances[userA][userB] = how much userA owes userB
  const pairwise: Record<string, Record<string, number>> = {};
  
  group.members.forEach((m: any) => {
    pairwise[m.id] = {};
    group.members.forEach((other: any) => {
      pairwise[m.id][other.id] = 0;
    });
  });

  expenses.forEach((expense: any) => {
    const payerId = expense.paidById;
    expense.splits.forEach((split: any) => {
      const borrowerId = split.userId;
      const amount = parseFloat(split.amountOwed);
      
      if (borrowerId !== payerId && pairwise[borrowerId] && pairwise[payerId]) {
        pairwise[borrowerId][payerId] += amount;
        pairwise[payerId][borrowerId] -= amount;
      }
    });
  });

  // 2. Aggregate pairwise debts into per-user breakdowns
  const memberBalances = group.members.map((member: any) => {
    let netBalance = 0;
    const owes: { toUser: any, amount: number }[] = [];
    const getsBack: { fromUser: any, amount: number }[] = [];

    group.members.forEach((other: any) => {
      if (other.id === member.id) return;
      
      const amountOwedToOther = pairwise[member.id][other.id];
      
      if (amountOwedToOther > 0.01) {
        owes.push({ toUser: other, amount: amountOwedToOther });
        netBalance -= amountOwedToOther;
      } else if (amountOwedToOther < -0.01) {
        getsBack.push({ fromUser: other, amount: Math.abs(amountOwedToOther) });
        netBalance += Math.abs(amountOwedToOther);
      }
    });

    return {
      ...member,
      netBalance, // Positive if they get back, negative if they owe
      owes,
      getsBack,
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
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Balance Breakdown</h5>
                
                {member.owes.length === 0 && member.getsBack.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center italic py-2">Settled up with everyone.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Owes */}
                    {member.owes.length > 0 && (
                      <div className="space-y-1">
                        {member.owes.map((debt: any) => {
                          const pairId = `${member.id}-owes-${debt.toUser.id}`;
                          const isPairExpanded = expandedPairId === pairId;
                          
                          return (
                            <div key={debt.toUser.id} className="space-y-1">
                              <div 
                                onClick={(e) => togglePair(e, pairId)}
                                className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-7 w-7 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0">
                                    {debt.toUser.firstName.charAt(0)}{debt.toUser.lastName.charAt(0)}
                                  </div>
                                  <span className="text-foreground">
                                    {isMe ? 'You owe' : 'Owes'} <span className="font-semibold">{debt.toUser.id === currentUserId ? 'You' : debt.toUser.firstName}</span>
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-orange-500">₹{debt.amount.toFixed(2)}</span>
                                  {isMe && debt.toUser.upiId && (
                                    <PayNowButton 
                                      upiId={debt.toUser.upiId} 
                                      name={`${debt.toUser.firstName} ${debt.toUser.lastName}`}
                                      amount={debt.amount}
                                    />
                                  )}
                                  {isPairExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground ml-1" /> : <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />}
                                </div>
                              </div>

                              {isPairExpanded && (
                                <div className="pl-12 pr-2 py-2 space-y-3 border-l-2 border-orange-500/20 ml-3 mt-1 mb-2 animate-in slide-in-from-top-1 fade-in duration-200">
                                  {getTransactionsBetween(member.id, debt.toUser.id).map(tx => (
                                    <div key={tx.expense.id} className="flex justify-between items-start text-xs">
                                      <div className="flex flex-col pr-2 min-w-0">
                                        <span className="font-medium text-foreground leading-tight truncate">{tx.expense.description}</span>
                                        <span className="text-[10px] text-muted-foreground mt-0.5">{tx.payerName} paid</span>
                                      </div>
                                      <span className={`font-semibold whitespace-nowrap ${tx.isLent ? 'text-emerald-500' : 'text-orange-500'}`}>
                                        {tx.isLent ? '+' : '-'}₹{tx.amount.toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Gets Back */}
                    {member.getsBack.length > 0 && (
                      <div className="space-y-1">
                        {member.getsBack.map((credit: any) => {
                          const pairId = `${member.id}-gets-${credit.fromUser.id}`;
                          const isPairExpanded = expandedPairId === pairId;

                          return (
                            <div key={credit.fromUser.id} className="space-y-1">
                              <div 
                                onClick={(e) => togglePair(e, pairId)}
                                className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-7 w-7 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                                    {credit.fromUser.firstName.charAt(0)}{credit.fromUser.lastName.charAt(0)}
                                  </div>
                                  <span className="text-foreground">
                                    {isMe ? 'You get back from' : 'Gets back from'} <span className="font-semibold">{credit.fromUser.id === currentUserId ? 'You' : credit.fromUser.firstName}</span>
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-emerald-500">₹{credit.amount.toFixed(2)}</span>
                                  {isPairExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                </div>
                              </div>

                              {isPairExpanded && (
                                <div className="pl-12 pr-2 py-2 space-y-3 border-l-2 border-emerald-500/20 ml-3 mt-1 mb-2 animate-in slide-in-from-top-1 fade-in duration-200">
                                  {getTransactionsBetween(member.id, credit.fromUser.id).map(tx => (
                                    <div key={tx.expense.id} className="flex justify-between items-start text-xs">
                                      <div className="flex flex-col pr-2 min-w-0">
                                        <span className="font-medium text-foreground leading-tight truncate">{tx.expense.description}</span>
                                        <span className="text-[10px] text-muted-foreground mt-0.5">{tx.payerName} paid</span>
                                      </div>
                                      <span className={`font-semibold whitespace-nowrap ${tx.isLent ? 'text-emerald-500' : 'text-orange-500'}`}>
                                        {tx.isLent ? '+' : '-'}₹{tx.amount.toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
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

