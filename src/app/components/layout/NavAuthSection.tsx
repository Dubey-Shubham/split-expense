import { cookies } from "next/headers";
import Link from "next/link";
import { User } from "lucide-react";
import { LogoutButton } from "./LogoutButton";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/groups", label: "Groups" },
  { href: "/budget", label: "Budget" },
];

/**
 * NavAuthSection — async Server Component
 *
 * This is the ONLY place in the layout tree that calls cookies().
 * Keeping it here (instead of in layout.tsx) means the layout shell
 * stays a static Server Component. This component streams in via
 * the <Suspense> boundary in TopNav.
 */
export async function NavAuthSection({ pathname }: { pathname?: string }) {
  const cookieStore = await cookies();
  const isAuthenticated = !!cookieStore.get("session_user")?.value;

  if (!isAuthenticated) {
    return (
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
    );
  }

  return (
    <nav className="flex items-center space-x-6 text-sm font-medium">
      {/* Desktop Navigation Links */}
      <div className="hidden md:flex items-center space-x-6">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`transition-colors hover:text-foreground/80 ${pathname === item.href
                ? "text-foreground font-semibold"
                : "text-muted-foreground"
              }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Profile Avatar Button */}
      <Link
        href="/profile"
        className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        title="View Profile"
      >
        <User className="h-4 w-4" />
      </Link>

      {/* Logout Button (client, handles router.refresh) */}
      <LogoutButton className="hidden md:flex" />
    </nav>
  );
}

/**
 * BottomNavAuthSection — async Server Component
 *
 * Returns null for guests (hides mobile nav), or the children
 * (mobile nav items) for authenticated users. The actual nav
 * markup stays in BottomNav (client) so usePathname works.
 */
export async function BottomNavAuthSection({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAuthenticated = !!cookieStore.get("session_user")?.value;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
