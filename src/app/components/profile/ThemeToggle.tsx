"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  // provided by next theme, it reads value of react context created by NextThemesProvider 
  // theme and setTheme are 2 of values destructured here
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount (will wait for complete component mount so current theme can be read)
  useEffect(() => {
    setMounted(true);
  }, []);

  // this is just a screen reader to say toggle theme if component not mounted
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="rounded-full w-10 h-10 shrink-0">
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full w-10 h-10 shrink-0"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <Sun className="h-[1.2rem] w-[1.2rem] text-orange-400 transition-all" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] text-indigo-500 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span> {/**if button rendered show this */}
    </Button>
  );
}
