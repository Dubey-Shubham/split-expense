"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Wallet, MessageCircle, HelpCircle } from "lucide-react";
import { updateLastReadExpensesAction, updateLastReadMessagesAction } from "@/app/actions/messages";
import { getPusherClient } from "@/lib/pusher";

export function GroupTabs({ 
  groupId, 
  initialUnreadExpenses, 
  initialUnreadMessages, 
  children 
}: { 
  groupId: string;
  initialUnreadExpenses: number;
  initialUnreadMessages: number;
  children: React.ReactNode;
}) {
  const [unreadExpenses, setUnreadExpenses] = useState(initialUnreadExpenses);
  const [unreadMessages, setUnreadMessages] = useState(initialUnreadMessages);
  const [activeTab, setActiveTab] = useState("settle");

  useEffect(() => {
    const pusherClient = getPusherClient();
    const channelName = `presence-group-${groupId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind("new-message", () => {
      if (activeTab !== "messages") {
        setUnreadMessages(prev => prev + 1);
      } else {
        updateLastReadMessagesAction(groupId);
      }
    });

    channel.bind("new-expense", () => {
      if (activeTab !== "settle") {
        setUnreadExpenses(prev => prev + 1);
      } else {
        updateLastReadExpensesAction(groupId);
      }
    });

    return () => {
      channel.unbind("new-message");
      channel.unbind("new-expense");
      pusherClient.unsubscribe(channelName);
    };
  }, [groupId, activeTab]);

  // We no longer clear expenses instantly on load so the user has time to see the badge.
  // Instead, they can click the active tab again to dismiss the badge.

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "settle" && unreadExpenses > 0) {
      setUnreadExpenses(0);
      updateLastReadExpensesAction(groupId);
    } else if (value === "messages" && unreadMessages > 0) {
      setUnreadMessages(0);
      updateLastReadMessagesAction(groupId);
    }
  };

  const contents = React.Children.toArray(children);

  return (
    <Tabs defaultValue="settle" className="w-full flex flex-col flex-1 min-h-0" onValueChange={handleTabChange}>
      <TabsList className="flex w-full rounded-2xl bg-card border border-border p-1 !h-auto gap-1 shadow-sm shrink-0">
        <TabsTrigger 
          value="settle" 
          className="flex-1 rounded-xl py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col gap-1 h-auto"
          onClick={() => {
            if (unreadExpenses > 0) {
              setUnreadExpenses(0);
              updateLastReadExpensesAction(groupId);
            }
          }}
        >
          <div className="relative">
            <Wallet className="h-4 w-4" />
            {unreadExpenses > 0 && (
              <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-in zoom-in">
                {unreadExpenses > 99 ? '99+' : unreadExpenses}
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-xs font-medium">Settle</span>
        </TabsTrigger>

        <TabsTrigger 
          value="messages" 
          className="flex-1 rounded-xl py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col gap-1 h-auto"
          onClick={() => {
            if (unreadMessages > 0) {
              setUnreadMessages(0);
              updateLastReadMessagesAction(groupId);
            }
          }}
        >
          <div className="relative">
            <MessageCircle className="h-4 w-4" />
            {unreadMessages > 0 && (
              <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-in zoom-in">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-xs font-medium">Messages</span>
        </TabsTrigger>

        <TabsTrigger value="balances" className="flex-1 rounded-xl py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col gap-1 h-auto">
          <HelpCircle className="h-4 w-4" />
          <span className="text-[10px] sm:text-xs font-medium">Balances</span>
        </TabsTrigger>
      </TabsList>

      <div className="mt-4 flex flex-col flex-1 min-h-0">
        {contents}
      </div>
    </Tabs>
  );
}
