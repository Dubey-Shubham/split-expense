"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Users, PieChart, User, Wallet, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

interface TopNavProps {
  isAuthenticated?: boolean;
}

export function TopNav({ isAuthenticated = false }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/groups", icon: Users, label: "Groups" },
    { href: "/budget", icon: PieChart, label: "Budget" },
  ];

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 sticky top-0">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto w-full justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="font-bold inline-block tracking-tight text-foreground">Expense Tracker</span>
        </Link>

        {isAuthenticated ? (
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`transition-colors hover:text-foreground/80 ${isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Profile Avatar Button */}
            <Link
              href="/profile"
              className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title="View Profile"
            >
              <User className="h-4 w-4" />
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        ) : (
          <div className="flex items-center space-x-3 text-sm font-medium">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground transition-colors py-2 px-3"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors py-2 px-4 rounded-full font-semibold shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
