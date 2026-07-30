import { Suspense } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { BottomNavAuthSection } from "@/components/layout/NavAuthSection";

/**
 * AppLayout — static Server Component
 *
 * No cookies(), no dynamic APIs. The layout shell is statically rendered.
 * Auth-aware content streams in via Suspense inside TopNav and BottomNavAuthSection.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <TopNav />

      <main className="flex-1 flex flex-col w-full max-w-8xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
        {children}
      </main>

      <Suspense fallback={null}>
        <BottomNavAuthSection>
          <BottomNav />
        </BottomNavAuthSection>
      </Suspense>
    </>
  );
}
