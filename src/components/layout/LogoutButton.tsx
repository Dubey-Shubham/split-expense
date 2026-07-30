"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

/**
 * LogoutButton — Client Component
 *
 * Extracted from TopNav so that NavAuthSection can remain a Server Component.
 * Handles the client-side router.refresh() after logout.
 */
export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push("/");
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      title="Log Out"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
