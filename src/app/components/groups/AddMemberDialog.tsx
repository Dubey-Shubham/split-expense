"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Loader2, Search, X } from "lucide-react";
import { searchUsersAction, addGroupMemberAction } from "@/app/actions/groups";
import { toast } from "sonner";

export function AddMemberDialog({ groupId, variant = "default" }: { groupId: string; variant?: "default" | "icon" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const res = await searchUsersAction(query, groupId);
      if (res.success) {
        setResults(res.data || []);
      }
      setIsSearching(false);
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [query, groupId]);

  const handleSelectUser = (user: any) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setQuery("");
    setResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleAddMembers = () => {
    if (selectedUsers.length === 0) return;
    setError("");
    startTransition(async () => {
      const userIds = selectedUsers.map((u) => u.id);
      const res = await addGroupMemberAction(groupId, userIds);
      if (res.success) {
        toast.success(`Successfully added ${selectedUsers.length} member(s)!`);
        setIsOpen(false);
        setQuery("");
        setResults([]);
        setSelectedUsers([]);
      } else {
        setError(res.error || "Failed to add members.");
        toast.error(res.error || "Failed to add members.");
      }
    });
  };

  const displayedResults = results.filter(
    (u) => !selectedUsers.find((su) => su.id === u.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {variant === "icon" ? (
        <DialogTrigger className="flex flex-row items-center justify-center h-[52px] w-[52px] sm:h-14 sm:w-14 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0">
          <UserPlus className="h-5 w-5 sm:h-6 sm:w-6" />
        </DialogTrigger>
      ) : (
        <DialogTrigger className="flex items-center justify-center w-full rounded-xl py-3 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-md transition-all">
          <UserPlus className="mr-2 h-5 w-5" />
          Add Group Member
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg bg-background backdrop-blur-sm z-50 border border-border shadow-2xl rounded-3xl p-6 flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2 flex-1 flex flex-col">
          {/* Selected Users List */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedUsers.map((user) => (
                <div key={user.id} className="flex items-center bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium border border-primary/20">
                  <span className="mr-2">{user.firstName} {user.lastName}</span>
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or mobile number..."
              className="pl-9 bg-muted/50 border-border/50 h-10 rounded-xl focus-visible:ring-1"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}

          <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-2">
            {isSearching ? (
              <div className="flex items-center justify-center p-4 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Searching...
              </div>
            ) : displayedResults.length > 0 ? (
              displayedResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-card hover:bg-muted/30 border border-border shadow-sm cursor-pointer transition-colors"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-semibold text-sm truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.firstName} {user.lastName}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-lg shrink-0 pointer-events-none"
                  >
                    Select
                  </Button>
                </div>
              ))
            ) : query.length >= 2 ? (
              <p className="text-center text-sm text-muted-foreground p-4">No users found.</p>
            ) : null}
          </div>


          <div className="pt-4 border-t border-border/50 mt-auto">
            <Button
              className="w-full rounded-xl py-6 font-bold shadow-md"
              onClick={handleAddMembers}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Adding {selectedUsers.length > 0 ? selectedUsers.length : ""} Member{selectedUsers.length > 1 ? 's' : ''}...
                </>
              ) : (
                <>Add {selectedUsers.length > 0 ? selectedUsers.length : ""} Member{selectedUsers.length > 1 ? 's' : ''}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
