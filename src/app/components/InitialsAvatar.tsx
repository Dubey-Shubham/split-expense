"use client";

import { cn } from "@/lib/utils";

interface InitialsAvatarProps {
  firstName: string;
  lastName: string;
  className?: string;
}

const colors = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
];

export function InitialsAvatar({ firstName, lastName, className }: InitialsAvatarProps) {
  const initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;

  // Pick a consistent color based on the name length to make it deterministic
  const colorIndex = (firstName.length + lastName.length) % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-white font-bold tracking-tight shadow-sm",
        bgColor,
        className
      )}
    >
      {initials}
    </div>
  );
}
