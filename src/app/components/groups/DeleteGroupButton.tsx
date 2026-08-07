"use client";

import React, { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteGroupAction } from "@/app/actions/groups";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

export function DeleteGroupButton({ groupId }: { groupId: string }) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  };

  const handleConfirmDelete = () => {
    startTransition(async () => {
      const res = await deleteGroupAction(groupId);
      if (!res.success) {
        toast.error(res.error || "Failed to delete group.");
      } else {
        toast.success("Group deleted successfully!");
        setIsOpen(false);
      }
    });
  };

  const handleCancelDelete = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={handleTriggerClick}
        disabled={isPending}
        className={`absolute right-4 top-4 h-8 w-8 rounded-full border border-border hover:border-destructive/30 hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors shadow-sm ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Delete Group"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <ConfirmDialog
        isOpen={isOpen}
        title="Delete Group?"
        description="Are you sure you want to delete this group? All expenses and membership history will be permanently removed."
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDestructive={true}
        isLoading={isPending}
      />
    </>
  );
}
