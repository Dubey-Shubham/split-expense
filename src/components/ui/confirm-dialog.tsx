"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = true,
  isLoading = false,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Don't render anything on the server to prevent hydration mismatches
  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={!isLoading ? onCancel : undefined}
      />
      
      {/* Dialog Modal */}
      <div className="bg-card border border-border shadow-2xl rounded-3xl w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onCancel}
          disabled={isLoading}
          className="absolute right-4 top-4 h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-4">
          <div className={`p-3 rounded-2xl ${isDestructive ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          
          <div className="space-y-2 w-full">
            <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 w-full">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto rounded-xl h-11"
          >
            {cancelText}
          </Button>
          <Button 
            variant={isDestructive ? "destructive" : "default"} 
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto rounded-xl h-11 shadow-sm"
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
