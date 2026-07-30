import { Suspense } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { NavAuthSection } from "./NavAuthSection";

/**
 * TopNav — Server Component
 *
 * Now that all client-side hooks (useRouter, useTransition) have been
 * moved into LogoutButton, this component needs no client APIs and can
 * be a plain Server Component. That lets it directly import and render
 * NavAuthSection (also a Server Component) without the prop-slot workaround.
 */
export function TopNav() {
  return (
    <div className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 sticky top-0">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto w-full justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="font-bold inline-block tracking-tight text-foreground">
            Expense Tracker
          </span>
        </Link>

        {/* NavAuthSection streams in independently — static logo renders instantly */}
        <Suspense fallback={<NavSkeleton />}>
          <NavAuthSection />
        </Suspense>
      </div>
    </div>
  );
}

function NavSkeleton() {
  return (
    <div className="flex items-center space-x-3 animate-pulse">
      <div className="h-8 w-16 rounded-full bg-muted" />
      <div className="h-8 w-20 rounded-full bg-muted" />
    </div>
  );
}
