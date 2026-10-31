import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/app/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Expense Tracker",
    template: "%s | Expense Tracker",
  },
  description: "Split expenses, track shared bills with friends and roommates, and settle balances effortlessly.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Expense Tracker",
    description: "Split expenses, track shared bills with friends and roommates, and settle balances effortlessly.",
    siteName: "Expense Tracker",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Expense Tracker",
    description: "Split expenses, track shared bills with friends and roommates, and settle balances effortlessly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"              // will change theme by class change
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange      //temporarily disables CSS transitions during the theme switch so the change appears instant, then restores transitions afterward
        >
          <div className="flex min-h-[100dvh] w-full flex-col relative">
            {children}
          </div>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}

// The ThemeProvider here is essentially a wrapper around the provider from the next-themes library. It makes the current theme (light, dark, or system) available to your entire React application through React Context.

// It is inside rootlayout to insert same class in every component