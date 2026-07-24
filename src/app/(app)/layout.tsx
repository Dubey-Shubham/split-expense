import { cookies } from "next/headers";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopNav } from "@/components/layout/TopNav";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_user")?.value;
  const isAuthenticated = !!userId;

  return (
    <>
      <TopNav isAuthenticated={isAuthenticated} />
      <main className="flex-1 flex flex-col w-full max-w-8xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
        {children}
      </main>
      <BottomNav isAuthenticated={isAuthenticated} />
    </>
  );
}
