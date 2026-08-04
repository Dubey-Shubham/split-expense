"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/app/actions/profile";
import { Loader2 } from "lucide-react";

interface ProfileFormProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    upiId: string | null;
    mobileNumber: string | null;
  };
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  upiId: string;
  mobileNumber: string;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { register, handleSubmit } = useForm<ProfileFormData>({
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      upiId: user.upiId || "",
      mobileNumber: user.mobileNumber || "",
    },
  });

  useEffect(() => {
    if (message?.type === "success") {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const onSubmit = (data: ProfileFormData) => {
    setMessage(null);

    startTransition(async () => {
      const result = await updateProfileAction(data);
      if (result.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
      } else {
        setMessage({ type: "error", text: result.error || "Failed to update profile." });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4 bg-card border border-border rounded-2xl p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground tracking-tight">Personal Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" {...register("firstName", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" {...register("lastName", { required: true })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" defaultValue={user.email} disabled className="bg-muted/50 opacity-80" />
          <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
        </div>
      </div>

      <div className="space-y-4 bg-card border border-border rounded-2xl p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground tracking-tight">Additional Info</h3>

        <div className="space-y-2">
          <Label htmlFor="mobileNumber">Mobile Number (Optional)</Label>
          <Input id="mobileNumber" type="tel" placeholder="+1 (555) 000-0000" {...register("mobileNumber")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="upiId">Payment ID (UPI/Venmo) (Optional)</Label>
          <Input id="upiId" placeholder="user@bank or @username" {...register("upiId")} />
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-sm font-medium ${message.type === "success"
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="rounded-xl px-8 shadow-md">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
