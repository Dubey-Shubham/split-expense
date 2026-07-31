"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, PieChart, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/groups", icon: Users, label: "Groups" },
  { href: "/budget", icon: PieChart, label: "Budget" },
  { href: "/profile", icon: User, label: "Profile" },
];

/**
 * BottomNav — Client Component
 *
 * Renders the mobile bottom navigation bar. Visibility is controlled
 * by BottomNavAuthSection (a Server Component in the layout) which
 * only renders this component's children when the user is authenticated.
 * This means no isAuthenticated prop is needed here.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 z-50 w-full border-t border-border bg-background/80 backdrop-blur-md md:hidden">
      <nav className="flex items-center justify-around pb-safe">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-3 transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? "fill-primary/20" : ""}`} />
              <span className="mt-1 text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
