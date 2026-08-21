"use client";

import React, { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createExpenseAction } from "@/app/actions/expenses";
import { toast } from "sonner";
import { Loader2, Receipt } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const expenseSchema = z.object({
  description: z.string().min(1, "Name is required"),
  amount: z.string().min(1, "Amount is required").refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a positive number"),
  category: z.string().min(1),
  customCategory: z.string().optional(),
  date: z.string().min(1),
  paidBy: z.string().min(1),
  notes: z.string().optional(),
  splitType: z.enum(["equal", "unequal", "percentage"]),
  splitWith: z.array(z.string()).min(1, "Select at least one person to split with"),
  customAmounts: z.record(z.string(), z.string().optional()).optional(),
  customPercentages: z.record(z.string(), z.string().optional()).optional(),
});
type ExpenseFormValues = z.infer<typeof expenseSchema>;

export function AddExpenseDialog({ group, currentUserId }: { group: any; currentUserId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "food",
      customCategory: "",
      date: new Date().toISOString().split("T")[0],
      paidBy: currentUserId,
      notes: "",
      splitType: "equal",
      splitWith: [currentUserId],
      customAmounts: {},
      customPercentages: {},
    }
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = form;

  const watchSplitType = watch("splitType");
  const watchSplitWith = watch("splitWith");
  const watchCategory = watch("category");

  const categories = [
    { value: "flight", label: "Flight" },
    { value: "food", label: "Food & Dining" },
    { value: "hotel", label: "Hotel" },
    { value: "groceries", label: "Groceries" },
    { value: "transport", label: "Transport" },
    { value: "entertainment", label: "Entertainment" },
    { value: "shopping", label: "Shopping" },
    { value: "drinks", label: "Drinks" },
    { value: "bills", label: "Bills" },
    { value: "health", label: "Health" },
    { value: "other", label: "Other" },
  ];

  const handleToggleSplit = (memberId: string) => {
    const current = watchSplitWith || [];
    if (current.includes(memberId)) {
      setValue("splitWith", current.filter((id) => id !== memberId), { shouldValidate: true });
    } else {
      setValue("splitWith", [...current, memberId], { shouldValidate: true });
    }
  };

  const handleAddAll = () => {
    setValue("splitWith", group.members.map((m: any) => m.id), { shouldValidate: true });
  };

  const onSubmit = (values: ExpenseFormValues) => {
    const amountFloat = parseFloat(values.amount);
    let calculatedSplits: { userId: string; amountOwed: string }[] = [];

    if (values.splitType === "equal") {
      const splitAmount = (amountFloat / values.splitWith.length).toFixed(2);
      calculatedSplits = values.splitWith.map((userId) => ({
        userId,
        amountOwed: splitAmount,
      }));
    } else if (values.splitType === "unequal") {
      let totalAssigned = 0;
      for (const member of group.members) {
        if (values.splitWith.includes(member.id)) {
          const val = parseFloat(values.customAmounts?.[member.id] || "0");
          if (val > 0) {
            totalAssigned += val;
            calculatedSplits.push({ userId: member.id, amountOwed: val.toFixed(2) });
          }
        }
      }
      if (Math.abs(totalAssigned - amountFloat) > 0.05) {
        toast.error(`Unequal amounts must add up to the total (₹${amountFloat.toFixed(2)}). Currently at ₹${totalAssigned.toFixed(2)}.`);
        return;
      }
    } else if (values.splitType === "percentage") {
      let totalPercentage = 0;
      let totalAssigned = 0;
      for (const member of group.members) {
        if (values.splitWith.includes(member.id)) {
          const pct = parseFloat(values.customPercentages?.[member.id] || "0");
          if (pct > 0) {
            totalPercentage += pct;
            const assignedAmount = (amountFloat * (pct / 100));
            totalAssigned += assignedAmount;
            calculatedSplits.push({ userId: member.id, amountOwed: assignedAmount.toFixed(2) });
          }
        }
      }
      if (Math.abs(totalPercentage - 100) > 0.1) {
        toast.error(`Percentages must add up to exactly 100%. Currently at ${totalPercentage}%.`);
        return;
      }
    }

    if (calculatedSplits.length === 0) {
      toast.error("No valid splits were created.");
      return;
    }

    startTransition(async () => {
      const res = await createExpenseAction({
        groupId: group.id,
        description: values.description,
        amount: values.amount,
        category: values.category === "other" ? (values.customCategory || "other") : values.category,
        paidBy: values.paidBy,
        splits: calculatedSplits,
        date: values.date,
      });

      if (res.success) {
        toast.success("Expense added successfully!");
        setIsOpen(false);
        reset();
      } else {
        toast.error(res.error || "Failed to add expense.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) reset(); // Reset form when closing without saving
    }}>
      <DialogTrigger className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition-colors flex items-center gap-2 shrink-0">
        <Receipt className="h-4 w-4 hidden sm:block" /> Add Expense
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl h-full max-h-[90vh] flex flex-col rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="p-6 sm:p-8 pb-4 shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl sm:text-2xl font-bold m-0 p-0">
            Add Expense in {group.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-6 sm:pb-8">
          <form 
            onSubmit={handleSubmit(onSubmit, (errors) => {
              console.error("Form validation errors:", errors);
              const firstError = Object.values(errors)[0];
              if (firstError?.message) {
                toast.error(String(firstError.message));
              } else if (firstError && typeof firstError === 'object') {
                 // for nested errors like customAmounts
                 toast.error("Please fill in all required fields properly.");
              }
            })} 
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Description (renamed to Name) */}
              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold">Name</Label>
                <Input
                  id="description"
                  placeholder="Dinner at Luigi's"
                  {...register("description")}
                  className="bg-muted/50 border-transparent rounded-xl focus-visible:ring-primary h-11"
                />
                {errors.description && <p className="text-destructive text-xs">{errors.description.message}</p>}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="font-semibold">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...register("amount")}
                  className="bg-muted/50 border-transparent rounded-xl focus-visible:ring-primary h-11 text-lg font-bold"
                />
                {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="font-semibold">Category</Label>
                <select
                  id="category"
                  {...register("category")}
                  className="flex w-full items-center justify-between rounded-xl border border-transparent bg-muted/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 h-11"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Custom Category if "Other" */}
              {watchCategory === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="customCategory" className="font-semibold">Specify Category</Label>
                  <Input
                    id="customCategory"
                    placeholder="Custom..."
                    {...register("customCategory")}
                    className="bg-muted/50 border-transparent rounded-xl focus-visible:ring-primary h-11"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="font-semibold">Date</Label>
                <Input
                  id="date"
                  type="date"
                  {...register("date")}
                  className="bg-muted/50 border-transparent rounded-xl focus-visible:ring-primary h-11"
                />
                {errors.date && <p className="text-destructive text-xs">{errors.date.message}</p>}
              </div>

              {/* Paid By */}
              <div className="space-y-2">
                <Label htmlFor="paidBy" className="font-semibold">Paid By</Label>
                <select
                  id="paidBy"
                  {...register("paidBy")}
                  className="flex w-full items-center justify-between rounded-xl border border-transparent bg-muted/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 h-11"
                >
                  {group.members.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.id === currentUserId ? "You" : `${m.firstName} ${m.lastName}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Split With */}
            <div className="space-y-3 bg-muted/20 p-4 rounded-2xl border border-border/50">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                <Label className="font-semibold text-base">Split With</Label>

                {/* Dropdown to add members */}
                {group.members.filter((m: any) => !watchSplitWith.includes(m.id)).length > 0 && (
                  <select
                    className="h-8 rounded-lg border border-transparent bg-background px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        setValue("splitWith", [...watchSplitWith, e.target.value], { shouldValidate: true });
                      }
                    }}
                  >
                    <option value="" disabled>+ Add member</option>
                    {group.members
                      .filter((m: any) => !watchSplitWith.includes(m.id))
                      .map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.id === currentUserId ? "You" : `${m.firstName} ${m.lastName}`}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              <Tabs 
                value={watchSplitType} 
                onValueChange={(v) => {
                  const newType = v as ExpenseFormValues["splitType"];
                  setValue("splitType", newType);
                  if (newType === "equal") {
                    setValue("customAmounts", {});
                    setValue("customPercentages", {});
                  } else if (newType === "unequal") {
                    setValue("customPercentages", {});
                  } else if (newType === "percentage") {
                    setValue("customAmounts", {});
                  }
                }} 
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 mb-4 rounded-xl">
                  <TabsTrigger value="equal" className="rounded-lg text-xs">Equally</TabsTrigger>
                  <TabsTrigger value="unequal" className="rounded-lg text-xs">Unequally</TabsTrigger>
                  <TabsTrigger value="percentage" className="rounded-lg text-xs">By %</TabsTrigger>
                </TabsList>

                <TabsContent value="equal" className="space-y-3 m-0">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddAll}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Add All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {group.members
                      .filter((m: any) => watchSplitWith.includes(m.id))
                      .map((m: any) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-background"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                              {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                            </div>
                            <span className="text-sm font-medium truncate">
                              {m.id === currentUserId ? "You" : `${m.firstName} ${m.lastName}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleSplit(m.id)}
                            className="text-muted-foreground hover:text-destructive shrink-0"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                          </button>
                        </div>
                      ))}
                  </div>
                  {errors.splitWith && <p className="text-destructive text-xs mt-2">{errors.splitWith.message}</p>}
                </TabsContent>

                <TabsContent value="unequal" className="space-y-3 m-0">
                  <div className="space-y-3 mt-2">
                    {group.members
                      .filter((m: any) => watchSplitWith.includes(m.id))
                      .map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                              {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                            </div>
                            <span className="text-sm font-medium truncate">
                              {m.id === currentUserId ? "You" : `${m.firstName} ${m.lastName}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-semibold text-muted-foreground">₹</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...register(`customAmounts.${m.id}`)}
                              className="h-8 w-20 sm:w-24 text-right bg-muted/50 rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleToggleSplit(m.id)}
                              className="text-muted-foreground hover:text-destructive shrink-0 ml-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="percentage" className="space-y-3 m-0">
                  <div className="space-y-3 mt-2">
                    {group.members
                      .filter((m: any) => watchSplitWith.includes(m.id))
                      .map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                              {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                            </div>
                            <span className="text-sm font-medium truncate">
                              {m.id === currentUserId ? "You" : `${m.firstName} ${m.lastName}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              placeholder="0"
                              {...register(`customPercentages.${m.id}`)}
                              className="h-8 w-16 sm:w-20 text-right bg-muted/50 rounded-lg"
                            />
                            <span className="text-sm font-semibold text-muted-foreground">%</span>
                            <button
                              type="button"
                              onClick={() => handleToggleSplit(m.id)}
                              className="text-muted-foreground hover:text-destructive shrink-0 ml-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="font-semibold">Additional Notes (Optional)</Label>
              <textarea
                id="notes"
                placeholder="Any details to remember..."
                {...register("notes")}
                className="flex w-full rounded-xl border border-transparent bg-muted/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-primary text-primary-foreground h-12 rounded-xl font-bold text-base hover:bg-primary/90 transition-colors flex items-center justify-center shadow-lg disabled:opacity-50 mt-6 shrink-0"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Save Expense"
              )}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
