"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyGroupLinkButton({ groupId }: { groupId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // Generate the invite link (you can change this to /invite/[groupId] later)
    const link = `${window.location.origin}/invite/${groupId}`;
    
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center justify-center w-full rounded-xl py-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-all border border-border"
    >
      {copied ? (
        <>
          <Check className="mr-2 h-4 w-4 text-emerald-500" />
          Copied to clipboard!
        </>
      ) : (
        <>
          <Copy className="mr-2 h-4 w-4" />
          Copy Group Link
        </>
      )}
    </button>
  );
}
