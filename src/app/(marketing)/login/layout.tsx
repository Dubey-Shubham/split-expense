import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to your Expense Tracker account to manage your budget and split expenses with friends.",
  openGraph: {
    title: "Login | Expense Tracker",
    description: "Log in to your Expense Tracker account to manage your budget and split expenses with friends.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
