"use client";

import React, { useState, useTransition } from "react";
import { UserMinus } from "lucide-react";
import { toast } from "sonner";
import { removeGroupMemberAction } from "@/app/actions/groups";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function RemoveMemberButton({ groupId, userId }: { groupId: string; userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  };

  const handleConfirmRemove = () => {
    startTransition(async () => {
      const res = await removeGroupMemberAction(groupId, userId);
      if (res.success) {
        toast.success("Member removed successfully.");
        setIsOpen(false);
      } else {
        toast.error(res.error || "Failed to remove member.");
      }
    });
  };

  return (
    <>
      <button
        onClick={handleTriggerClick}
        disabled={isPending}
        className="h-8 w-8 rounded-full border border-border hover:border-destructive/30 hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors shadow-sm ml-2 disabled:opacity-50"
        title="Remove Member"
      >
        <UserMinus className="h-4 w-4" />
      </button>

      <ConfirmDialog
        isOpen={isOpen}
        title="Remove Member?"
        description="Are you sure you want to remove this user from the group?"
        confirmText="Remove"
        onConfirm={handleConfirmRemove}
        onCancel={() => setIsOpen(false)}
        isDestructive={true}
        isLoading={isPending}
      />
    </>
  );
}
