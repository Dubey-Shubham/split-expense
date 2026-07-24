"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, PieChart, User } from "lucide-react";

interface BottomNavProps {
  isAuthenticated?: boolean;
}

export function BottomNav({ isAuthenticated = false }: BottomNavProps) {
  const pathname = usePathname();

  // Hide the navigation entirely on mobile for logged out visitors
  if (!isAuthenticated) return null;

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/groups", icon: Users, label: "Groups" },
    { href: "/budget", icon: PieChart, label: "Budget" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 z-50 w-full border-t border-border bg-background/80 backdrop-blur-md md:hidden">
      <nav className="flex items-center justify-around pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-3 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
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
