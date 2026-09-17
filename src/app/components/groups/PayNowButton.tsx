"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, ExternalLink } from "lucide-react";

export function PayNowButton({ upiId, name, amount }: { upiId: string, name: string, amount: number }) {
  const [open, setOpen] = useState(false);
  
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <button 
            onClick={(e) => e.stopPropagation()}
            className="ml-3 inline-flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-bold transition-colors"
          />
        }
      >
        Pay Now
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-border bg-card rounded-[2rem] p-6" onClick={(e) => e.stopPropagation()}>
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold text-center">Pay {name}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm">
            <img 
              src={qrUrl} 
              alt="UPI QR Code" 
              className="w-48 h-48"
              loading="lazy"
            />
          </div>
          
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">Scan with any UPI app</p>
            <p className="text-2xl font-black text-foreground">₹{amount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-2">{upiId}</p>
          </div>

          <a 
            href={upiLink}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center rounded-xl py-3 font-semibold transition-colors"
          >
            Open UPI App
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
