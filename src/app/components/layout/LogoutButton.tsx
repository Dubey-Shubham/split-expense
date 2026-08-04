"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

/**
 * LogoutButton — Client Component
 *
 * Extracted from TopNav so that NavAuthSection can remain a Server Component.
 * Handles the client-side router.refresh() after logout.
 */
export function LogoutButton({ className, showText = false }: { className?: string, showText?: boolean }) {
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
      className={cn(
        "flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50",
        showText ? "px-4 py-2 gap-2 w-full font-medium" : "h-8 w-8",
        className
      )}
      title="Log Out"
    >
      <LogOut className="h-4 w-4" />
      {showText && <span>{isPending ? "Logging out..." : "Log Out"}</span>}
    </button>
  );
}
