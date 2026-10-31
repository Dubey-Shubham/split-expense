import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create an account on Expense Tracker to easily track shared expenses and settle balances.",
  openGraph: {
    title: "Sign Up | Expense Tracker",
    description: "Create an account on Expense Tracker to easily track shared expenses and settle balances.",
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
