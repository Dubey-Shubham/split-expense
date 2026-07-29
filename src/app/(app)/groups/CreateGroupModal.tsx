"use client";

import React, { useState, useTransition } from "react";
import { AlertCircle, Loader2, Plus, X, Home, Plane, Utensils, Beer, Wallet } from "lucide-react";
import { createGroupAction } from "@/app/actions/groups";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const CATEGORIES = [
  { value: "home", label: "Household / Rent", icon: Home },
  { value: "trip", label: "Travel / Trip", icon: Plane },
  { value: "food", label: "Dining / Food", icon: Utensils },
  { value: "party", label: "Night out / Drinks", icon: Beer },
  { value: "other", label: "Other splits", icon: Wallet },
];

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required."),
  description: z.string().optional(),
  avatar: z.string(),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

export function CreateGroupModal() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      avatar: "other",
    },
  });

  const selectedAvatar = useWatch({ control, name: "avatar" });

  const onSubmit = (data: CreateGroupFormValues) => {
    setError(null);
    startTransition(async () => {
      const res = await createGroupAction({
        name: data.name,
        description: data.description || "",
        avatar: data.avatar,
      });

      if (!res.success) {
        setError(res.error || "Failed to create group.");
        return;
      }

      reset();
      setIsCreateOpen(false);
    });
  };

  const handleClose = () => {
    reset();
    setError(null);
    setIsCreateOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsCreateOpen(true)}
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-2xl transition-all duration-300 active:scale-[0.98] shadow-md flex items-center gap-2 text-sm"
      >
        <Plus className="h-4 w-4" />
        <span>New Group</span>
      </button>

      {isCreateOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
              <h3 className="font-bold text-foreground text-lg">Create New Group</h3>
              <button
                onClick={handleClose}
                className="h-8 w-8 rounded-full border border-border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Goa Trip 2026, Flatmates, Rent Bills"
                  {...register("name")}
                  className={`w-full bg-background border ${errors.name ? "border-destructive focus:ring-destructive/20" : "border-border focus:border-primary focus:ring-primary/20"} text-foreground rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-1 transition-all`}
                />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Description (Optional)</label>
                <textarea
                  placeholder="What is this group for?"
                  {...register("description")}
                  rows={2}
                  className="w-full bg-background border border-border text-foreground rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Category Icon</label>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    const isSelected = selectedAvatar === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setValue("avatar", cat.value, { shouldValidate: true })}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        title={cat.label}
                      >
                        <CatIcon className="h-5 w-5" />
                        <span className="text-[9px] mt-1 font-medium leading-none truncate max-w-full block">
                          {cat.value}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-border hover:bg-muted text-foreground text-sm font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-xl transition-all text-sm flex items-center justify-center gap-1.5 shadow"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Create Group</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
