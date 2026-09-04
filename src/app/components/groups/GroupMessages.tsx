"use client";

import React, { useState, useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher";
import { sendGroupMessageAction, editGroupMessageAction, deleteGroupMessageAction, updateLastReadAction } from "@/app/actions/messages";
import { Send, Edit2, Trash2, X, Users, Check, CheckCheck, MessageSquareWarning } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Message = {
  id: string;
  groupId: string;
  content: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
};

// Deterministic color generator based on userId string
const getUserColor = (userId: string) => {
  const colors = [
    "text-red-500", "text-blue-500", "text-green-500",
    "text-yellow-600", "text-purple-500", "text-pink-500",
    "text-indigo-500", "text-teal-500", "text-orange-500"
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export function GroupMessages({
  groupId,
  initialMessages,
  currentUserId
}: {
  groupId: string,
  initialMessages: Message[],
  currentUserId: string
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<number>(1);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const pusher = getPusherClient();
    const channelName = `presence-group-${groupId}`;
    const channel = pusher.subscribe(channelName);
    pusherChannelRef.current = channel;

    // Presence events
    channel.bind("pusher:subscription_succeeded", (members: any) => {
      setOnlineUsers(members.count);
    });

    channel.bind("pusher:member_added", () => {
      setOnlineUsers((prev) => prev + 1);
    });

    channel.bind("pusher:member_removed", () => {
      setOnlineUsers((prev) => Math.max(1, prev - 1));
    });

    // Message events
    channel.bind("new-message", (newMsg: Message) => {
      setMessages((prev) => [...prev, newMsg]);
      // If we receive a message and are viewing the chat, update last read
      updateLastReadAction(groupId);
    });

    channel.bind("message-updated", (updatedData: { id: string, content: string, isEdited: boolean, updatedAt: string }) => {
      setMessages((prev) => prev.map(m => m.id === updatedData.id ? { ...m, ...updatedData } : m));
    });

    channel.bind("message-deleted", (data: { id: string }) => {
      setMessages((prev) => prev.map(m => m.id === data.id ? { ...m, isDeleted: true, content: "" } : m));
    });

    // Typing events (Client Events)
    channel.bind("client-typing", (data: { userId: string, name: string }) => {
      if (data.userId === currentUserId) return;

      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.add(data.name);
        return newSet;
      });

      // Clear typing indicator after 3 seconds of no updates from that user
      // A more robust approach manages timeouts per user, but this works for basic UI
      setTimeout(() => {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.name);
          return newSet;
        });
      }, 3000);
    });

    // Mark as read when opening the component
    updateLastReadAction(groupId);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [groupId, currentUserId]);

  const handleTyping = () => {
    if (pusherChannelRef.current) {
      pusherChannelRef.current.trigger("client-typing", {
        userId: currentUserId,
        name: "Someone" // Ideal: pass current user's name from props to broadcast
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    // Throttle typing events
    if (!typingTimeoutRef.current) {
      handleTyping();
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 1000);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    setIsSending(true);
    const content = input;
    setInput("");

    const res = await sendGroupMessageAction(groupId, content);
    if (!res.success) {
      toast.error(res.error || "Failed to send message");
      setInput(content); // restore input
    }
    setIsSending(false);
  };

  const handleEditSubmit = async () => {
    if (!editingMessageId || !editContent.trim()) return;

    const res = await editGroupMessageAction(editingMessageId, groupId, editContent);
    if (res.success) {
      setEditingMessageId(null);
      setEditContent("");
    } else {
      toast.error(res.error || "Failed to edit message");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteGroupMessageAction(id, groupId);
    if (res.success) {
      toast.success("Message deleted");
    } else {
      toast.error(res.error || "Failed to delete message");
    }
    setMessageToDelete(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] sm:h-[calc(100vh-320px)] bg-card border border-border rounded-3xl shadow-sm overflow-hidden relative">

      {/* Header Area */}
      <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center justify-between shrink-0">
        <h3 className="font-bold text-foreground">Group Chat</h3>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-background px-3 py-1.5 rounded-full border border-border/50 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          {onlineUsers} {onlineUsers === 1 ? "member online" : "members online"}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 relative">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-70">
            <MessageSquareWarning className="h-12 w-12 mb-3" />
            <p>No messages yet.</p>
            <p className="text-sm">Be the first to say hi!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.userId === currentUserId;
            const showName = !isMe && (index === 0 || messages[index - 1].userId !== msg.userId);

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>

                {showName && (
                  <span className={`text-xs font-bold mb-1 ml-2 ${getUserColor(msg.userId)}`}>
                    {msg.userFirstName} {msg.userLastName}
                  </span>
                )}

                <div className={`relative max-w-[85%] sm:max-w-[75%] px-4 py-2 rounded-2xl group ${msg.isDeleted ? "bg-muted text-muted-foreground italic border border-border/50" :
                    isMe ? "bg-primary text-primary-foreground rounded-tr-sm shadow-sm" : "bg-muted text-foreground rounded-tl-sm shadow-sm"
                  }`}>

                  {msg.isDeleted ? (
                    <span className="text-sm">🚫 This message was deleted.</span>
                  ) : (
                    <>
                      {editingMessageId === msg.id ? (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="text-sm bg-background/20 text-current placeholder:text-current/50 border border-current/20 rounded px-2 py-1 outline-none"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handleEditSubmit()}
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingMessageId(null)} className="text-[10px] uppercase font-bold opacity-70 hover:opacity-100">Cancel</button>
                            <button onClick={handleEditSubmit} className="text-[10px] uppercase font-bold opacity-70 hover:opacity-100">Save</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</span>

                          <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                            {msg.isEdited && <span className="text-[9px] uppercase font-bold tracking-wider">Edited</span>}
                            <span className="text-[9px] ml-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && <CheckCheck className="h-3 w-3 ml-0.5" />}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Actions Menu (Hover) */}
                  {isMe && !msg.isDeleted && editingMessageId !== msg.id && (
                    <div className="absolute top-2 -left-16 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => {
                        setEditingMessageId(msg.id);
                        setEditContent(msg.content);
                      }} className="p-1.5 bg-background border border-border rounded-full text-muted-foreground hover:text-primary shadow-sm">
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button onClick={() => setMessageToDelete(msg.id)} className="p-1.5 bg-background border border-border rounded-full text-muted-foreground hover:text-destructive shadow-sm">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <div className="px-6 py-2 text-xs text-muted-foreground italic absolute bottom-20 left-0 bg-background/80 backdrop-blur w-full border-t border-border/50">
          {Array.from(typingUsers).join(", ")} {typingUsers.size === 1 ? "is" : "are"} typing...
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-background border-t border-border/50 shrink-0 flex items-center gap-2 relative z-10">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={handleInputChange}
          className="flex-1 bg-muted border-none rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="h-11 w-11 bg-primary text-primary-foreground rounded-full flex items-center justify-center shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          <Send className="h-4 w-4 ml-0.5" />
        </button>
      </form>

      <ConfirmDialog
        isOpen={!!messageToDelete}
        title="Delete Message?"
        description="Are you sure you want to delete this message?"
        confirmText="Delete"
        onConfirm={() => {
          if (messageToDelete) handleDelete(messageToDelete);
        }}
        onCancel={() => setMessageToDelete(null)}
        isDestructive={true}
      />
    </div>
  );
}
