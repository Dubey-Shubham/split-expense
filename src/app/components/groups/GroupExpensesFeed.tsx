"use client";

import { useState, useTransition } from "react";
import { Home, Plane, Utensils, Beer, Receipt, Trash2, Edit2, AlertTriangle, MessageSquareWarning, Loader2 } from "lucide-react";
import { deleteExpenseAction, disputeExpenseAction, withdrawDisputeAction } from "@/app/actions/expenses";
import { toast } from "sonner";
import { AddExpenseDialog } from "@/app/components/groups/AddExpenseDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function GroupExpensesFeed({ group, expenses, currentUserId }: { group: any, expenses: any[], currentUserId: string }) {
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [expenseToDelete, setExpenseToDelete] = useState<any | null>(null);
  const [disputingExpenseId, setDisputingExpenseId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

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

  const getMemberName = (id: string) => {
    if (id === currentUserId) return "You";
    const member = group.members.find((m: any) => m.id === id);
    return member ? `${member.firstName} ${member.lastName}` : "Unknown";
  };

  const handleDelete = (expenseId: string) => {
    startTransition(async () => {
      const res = await deleteExpenseAction(expenseId, group.id);
      if (res.success) {
        toast.success("Expense deleted successfully.");
        setExpenseToDelete(null);
        if (expandedExpenseId === expenseId) setExpandedExpenseId(null);
      } else {
        toast.error(res.error || "Failed to delete expense.");
      }
    });
  };

  const handleDispute = (expenseId: string) => {
    startTransition(async () => {
      const res = await disputeExpenseAction(expenseId, group.id, disputeReason);
      if (res.success) {
        toast.success("Dispute raised successfully.");
        setDisputingExpenseId(null);
        setDisputeReason("");
      } else {
        toast.error(res.error || "Failed to raise dispute.");
      }
    });
  };

  const handleWithdrawDispute = (expenseId: string) => {
    startTransition(async () => {
      const res = await withdrawDisputeAction(expenseId, group.id);
      if (res.success) {
        toast.success("Dispute withdrawn successfully.");
      } else {
        toast.error(res.error || "Failed to withdraw dispute.");
      }
    });
  };

  return (
    <div className="relative w-full flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-lg font-bold text-foreground ml-2">Expenses</h3>
        <AddExpenseDialog group={group} currentUserId={currentUserId} />
      </div>

      <div className="w-full space-y-6 overflow-y-auto custom-scrollbar pr-1 pb-4 flex-1 min-h-0">
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
          Object.entries(grouped).map(([monthYear, monthExpenses]) => {
            // If an expense is expanded, hide months that don't contain it
            if (expandedExpenseId && !(monthExpenses as any[]).some(e => e.id === expandedExpenseId)) {
              return null;
            }

            return (
              <div key={monthYear} className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-2">{monthYear}</h4>
                <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm divide-y divide-border/50">
                  {(monthExpenses as any[]).map((expense) => {
                    const isExpanded = expandedExpenseId === expense.id;

                    // If an expense is expanded, hide all other expenses
                    if (expandedExpenseId && !isExpanded) {
                      return null;
                    }

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

                    const payerName = iPaid ? "You" : expense.paidByFirstName;
                    const isDisputed = expense.disputes && expense.disputes.length > 0;
                    const hasDisputed = expense.disputes?.some((d: any) => d.userId === currentUserId);

                    return (
                      <div key={expense.id} className="flex flex-col group">
                        {/* Main Row */}
                        <div
                          onClick={() => {
                            setExpandedExpenseId(isExpanded ? null : expense.id);
                            if (isExpanded) {
                              setDisputingExpenseId(null);
                              setDisputeReason("");
                            }
                          }}
                          className={`flex items-center gap-3 sm:gap-4 p-4 transition-colors cursor-pointer ${isExpanded ? 'bg-muted/50' : 'hover:bg-muted/30'}`}
                        >
                          <div className="flex flex-col items-center justify-center min-w-[2.5rem] sm:min-w-[3rem] text-center">
                            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase">{month}</span>
                            <span className="text-lg sm:text-xl font-black text-foreground leading-none">{day}</span>
                          </div>

                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
                            {getCategoryIcon(expense.category)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-foreground text-sm sm:text-base truncate group-hover:text-primary transition-colors flex items-center gap-2">
                              {expense.description}
                              {isDisputed && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-md font-bold shrink-0">
                                  <AlertTriangle className="h-2.5 w-2.5" /> Disputed
                                </span>
                              )}
                            </h4>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">
                              <span className="font-semibold text-foreground/80">{payerName}</span> paid <span className="font-semibold text-foreground/80">₹{totalAmount.toFixed(2)}</span>
                            </p>
                          </div>

                          <div className="flex flex-col items-end justify-center shrink-0 text-right min-w-[4rem] sm:min-w-[5rem]">
                            <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${balanceColor}`}>{balanceText}</span>
                            {balanceAmount && <span className={`text-sm sm:text-base font-black ${balanceColor}`}>{balanceAmount}</span>}
                          </div>
                        </div>

                        {/* Expanded Details View */}
                        {isExpanded && (
                          <div className="bg-muted/20 border-t border-border/50 p-5 px-6 sm:px-8 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">

                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                                {payerName.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-foreground">
                                  {payerName} paid <span className="font-black text-primary">₹{totalAmount.toFixed(2)}</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {iPaid ? (
                                  <>
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <AddExpenseDialog
                                        group={group}
                                        currentUserId={currentUserId}
                                        expenseToEdit={expense}
                                        editModeTrigger={
                                          <button
                                            className="flex items-center justify-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors"
                                          >
                                            <Edit2 className="h-3 w-3" /> Edit
                                          </button>
                                        }
                                      />
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpenseToDelete(expense);
                                      }}
                                      className="flex items-center justify-center gap-1.5 bg-destructive/10 text-destructive px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-destructive/20 transition-colors"
                                    >
                                      <Trash2 className="h-3 w-3" /> Delete
                                    </button>
                                  </>
                                ) : (
                                  hasDisputed ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleWithdrawDispute(expense.id);
                                      }}
                                      disabled={isPending}
                                      className="flex items-center justify-center gap-1.5 bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-muted/80 transition-colors disabled:opacity-50"
                                    >
                                      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquareWarning className="h-3 w-3" />} Withdraw Dispute
                                    </button>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDisputingExpenseId(disputingExpenseId === expense.id ? null : expense.id);
                                      }}
                                      className="flex items-center justify-center gap-1.5 bg-orange-500/10 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-500/20 transition-colors"
                                    >
                                      <MessageSquareWarning className="h-3 w-3" /> {disputingExpenseId === expense.id ? "Cancel" : "Dispute"}
                                    </button>
                                  )
                                )}
                              </div>
                            </div>

                            <div className="space-y-2 pl-4 ml-4 border-l-2 border-border/60">
                              {expense.splits.map((s: any) => {
                                const splitName = getMemberName(s.userId);
                                const splitAmount = parseFloat(s.amountOwed);

                                // If this is the payer's own share
                                if (s.userId === expense.paidById) {
                                  return (
                                    <div key={s.userId} className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                                      <div className="flex items-center gap-2">
                                        <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold">
                                          {splitName.charAt(0)}
                                        </span>
                                        <span>{splitName}'s share</span>
                                      </div>
                                      <span className="font-semibold">₹{splitAmount.toFixed(2)}</span>
                                    </div>
                                  );
                                }

                                // For others who owe the payer
                                return (
                                  <div key={s.userId} className="flex items-center justify-between text-xs sm:text-sm text-foreground">
                                    <div className="flex items-center gap-2">
                                      <span className="h-5 w-5 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center text-[9px] font-bold border border-orange-500/20">
                                        {splitName.charAt(0)}
                                      </span>
                                      <span><span className="font-semibold">{splitName}</span> owes {iPaid ? "you" : (expense.paidByFirstName || payerName)}</span>
                                    </div>
                                    <span className="font-black text-orange-500">₹{splitAmount.toFixed(2)}</span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Display Disputes */}
                            {isDisputed && (
                              <div className="space-y-2 mt-4 pt-4 border-t border-red-500/20">
                                <h5 className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" /> Active Disputes
                                </h5>
                                {expense.disputes.map((d: any) => (
                                  <div key={d.id} className="bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg flex items-start gap-2">
                                    <div className="h-5 w-5 rounded-full bg-red-500/20 text-red-600 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                                      {d.firstName.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-foreground">
                                        {d.userId === currentUserId ? "You" : `${d.firstName} ${d.lastName}`}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">"{d.reason}"</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Dispute Inline Form */}
                            {disputingExpenseId === expense.id && !iPaid && (
                              <div className="mt-3 p-4 bg-card border border-orange-500/30 rounded-2xl space-y-3 shadow-sm animate-in zoom-in-95 duration-200">
                                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                  <AlertTriangle className="h-3.5 w-3.5 text-orange-500" /> What's wrong with this expense?
                                </p>
                                <input
                                  type="text"
                                  placeholder="E.g., I already paid Bob in cash..."
                                  value={disputeReason}
                                  onChange={(e) => setDisputeReason(e.target.value)}
                                  autoFocus
                                  className="w-full text-xs sm:text-sm bg-muted/50 border border-border rounded-xl p-3 focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDispute(expense.id);
                                  }}
                                  disabled={!disputeReason.trim() || isPending}
                                  className="w-full py-2.5 text-xs font-bold bg-orange-500 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors shadow-sm"
                                >
                                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Submit Dispute
                                </button>
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
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={!!expenseToDelete}
        title="Delete Expense?"
        description={`Are you sure you want to completely delete "${expenseToDelete?.description}"? This action cannot be undone and will erase the splits for everyone.`}
        confirmText="Delete Permanently"
        onConfirm={() => {
          if (expenseToDelete) handleDelete(expenseToDelete.id);
        }}
        onCancel={() => setExpenseToDelete(null)}
        isDestructive={true}
        isLoading={isPending}
      />
    </div>
  );
}
