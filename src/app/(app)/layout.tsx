import { BottomNav } from "@/components/layout/BottomNav";
import { TopNav } from "@/components/layout/TopNav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <TopNav />
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 md:px-6 py-6">{children}</main>
      <BottomNav />
    </>
  );
}
