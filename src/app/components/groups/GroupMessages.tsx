"use client";

import React, { useState, useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher";
import { sendGroupMessageAction, editGroupMessageAction, deleteGroupMessageAction, updateLastReadMessagesAction } from "@/app/actions/messages";
import { Send, Edit2, Trash2, X, Users, Check, CheckCheck, MessageSquareWarning, Smile, Plus, FileText, Reply } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  quotedExpenseId: string | null;
  quotedExpenseDescription: string | null;
  quotedExpenseAmount: string | null;
  repliedToMessageId: string | null;
  repliedToMessageContent: string | null;
  repliedToUserFirstName: string | null;
  repliedToUserLastName: string | null;
};

// Deterministic tinted bubble generator based on userId string
const getUserBubbleColor = (userId: string, isMe: boolean) => {
  if (isMe) {
    // Soft emerald tint for the current user's messages
    return "bg-emerald-500/15 text-emerald-950 dark:text-emerald-100 border border-emerald-500/20";
  }
  const colors = [
    "bg-blue-500/15 text-blue-950 dark:text-blue-100 border border-blue-500/20",
    "bg-purple-500/15 text-purple-950 dark:text-purple-100 border border-purple-500/20",
    "bg-pink-500/15 text-pink-950 dark:text-pink-100 border border-pink-500/20",
    "bg-amber-500/15 text-amber-950 dark:text-amber-100 border border-amber-500/20",
    "bg-indigo-500/15 text-indigo-950 dark:text-indigo-100 border border-indigo-500/20",
    "bg-rose-500/15 text-rose-950 dark:text-rose-100 border border-rose-500/20",
    "bg-cyan-500/15 text-cyan-950 dark:text-cyan-100 border border-cyan-500/20",
    "bg-orange-500/15 text-orange-950 dark:text-orange-100 border border-orange-500/20"
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
  currentUserId,
  expenses = []
}: {
  groupId: string,
  initialMessages: Message[],
  currentUserId: string,
  expenses?: any[]
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<number>(1);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quotedExpenseId, setQuotedExpenseId] = useState<string | null>(null);
  const [expenseSearchQuery, setExpenseSearchQuery] = useState("");
  
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    if ((!input.trim() && !quotedExpenseId) || isSending) return;

    setIsSending(true);
    const content = input;
    const qId = quotedExpenseId;
    const rId = replyingTo?.id;
    
    setInput("");
    setQuotedExpenseId(null);
    setReplyingTo(null);
    setShowEmojiPicker(false);

    const res = await sendGroupMessageAction(groupId, content, qId || undefined, rId || undefined);
    if (!res.success) {
      toast.error(res.error || "Failed to send message");
      setInput(content); // restore input
      setQuotedExpenseId(qId);
      if (rId) setReplyingTo(messages.find(m => m.id === rId) || null);
    }
    setIsSending(false);
  };

  const onEmojiClick = (emojiObject: any) => {
    setInput(prev => prev + emojiObject.emoji);
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
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4 relative">
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
                  <span className="text-xs font-bold mb-1 ml-2 opacity-70 text-foreground">
                    {msg.userFirstName} {msg.userLastName}
                  </span>
                )}

                <div className={`relative max-w-[85%] sm:max-w-[75%] px-4 py-2 rounded-2xl group ${
                  msg.isDeleted ? "bg-muted text-muted-foreground italic border border-border/50" :
                  `${getUserBubbleColor(msg.userId, isMe)} ${isMe ? "rounded-tr-sm shadow-sm" : "rounded-tl-sm shadow-sm"}`
                }`}>

                  {msg.isDeleted ? (
                    <span className="text-sm">🚫 This message was deleted.</span>
                  ) : (
                    <>
                      {msg.repliedToMessageId && (
                        <div className="mb-2 p-2 bg-foreground/5 rounded border-l-2 border-foreground/30 text-xs opacity-90">
                          <div className="font-semibold mb-0.5 opacity-100">
                            {msg.repliedToUserFirstName} {msg.repliedToUserLastName}
                          </div>
                          <div className="truncate max-w-[200px] opacity-75 italic">
                            {msg.repliedToMessageContent || "Deleted message"}
                          </div>
                        </div>
                      )}
                      
                      {msg.quotedExpenseId && (
                        <div className="mb-2 p-2 bg-background/20 rounded border-l-2 border-primary/50 text-xs">
                          <div className="flex items-center gap-1 font-semibold opacity-80 mb-0.5">
                            <Reply className="h-3 w-3" />
                            <span>Expense</span>
                          </div>
                          <div className="flex justify-between items-center opacity-90">
                            <span className="truncate max-w-[120px]">{msg.quotedExpenseDescription}</span>
                            <span className="font-mono">₹{msg.quotedExpenseAmount}</span>
                          </div>
                        </div>
                      )}
                      
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
                  {!msg.isDeleted && editingMessageId !== msg.id && (
                    <div className={`absolute top-2 ${isMe ? "-left-24" : "-right-10"} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <button onClick={() => setReplyingTo(msg)} className="p-1.5 bg-background border border-border rounded-full text-muted-foreground hover:text-primary shadow-sm" title="Reply">
                        <Reply className="h-3 w-3" />
                      </button>
                      {isMe && (
                        <>
                          <button onClick={() => {
                            setEditingMessageId(msg.id);
                            setEditContent(msg.content);
                          }} className="p-1.5 bg-background border border-border rounded-full text-muted-foreground hover:text-primary shadow-sm" title="Edit">
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button onClick={() => setMessageToDelete(msg.id)} className="p-1.5 bg-background border border-border rounded-full text-muted-foreground hover:text-destructive shadow-sm" title="Delete">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
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
      <div className="p-4 bg-background border-t border-border/50 shrink-0 flex flex-col gap-2 relative z-10">
        
        {quotedExpenseId && (
          <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 border border-border/50">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-semibold text-xs uppercase tracking-wide opacity-70">Quoting Expense</span>
            </div>
            <button type="button" onClick={() => setQuotedExpenseId(null)} className="p-1 hover:bg-background rounded-full">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {replyingTo && (
          <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 border border-border/50 border-l-4 border-l-primary">
            <div className="flex flex-col text-sm text-foreground">
              <span className="font-semibold text-xs text-primary">{replyingTo.userFirstName} {replyingTo.userLastName}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[300px]">{replyingTo.content}</span>
            </div>
            <button type="button" onClick={() => setReplyingTo(null)} className="p-1 hover:bg-background rounded-full">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          
          <div className="relative">
            <button 
              type="button" 
              onClick={() => setShowQuoteModal(true)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center bg-muted rounded-full px-2 border border-transparent focus-within:border-primary/20 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Smile className="h-5 w-5" />
            </button>

            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-2 z-50">
                <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.AUTO} />
              </div>
            )}

            <input 
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={handleInputChange}
              className="flex-1 bg-transparent border-none py-3 px-2 text-sm focus:outline-none"
              disabled={isSending}
            />
          </div>

          <button 
            type="submit" 
            disabled={(!input.trim() && !quotedExpenseId) || isSending}
            className="h-11 w-11 bg-primary text-primary-foreground rounded-full flex items-center justify-center shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            <Send className="h-4 w-4 ml-0.5" />
          </button>
        </form>
      </div>

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

      {/* Quote Expense Modal */}
      <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Quote an Expense</DialogTitle>
          </DialogHeader>
          
          <div className="px-1 py-2">
            <input 
              type="text" 
              placeholder="Search expenses by name..." 
              value={expenseSearchQuery}
              onChange={(e) => setExpenseSearchQuery(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 py-2">
            {expenses.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm">No expenses in this group yet.</p>
            ) : (
              expenses
                .filter(exp => exp.description.toLowerCase().includes(expenseSearchQuery.toLowerCase()))
                .map((expense) => (
                <button
                  key={expense.id}
                  type="button"
                  onClick={() => {
                    setQuotedExpenseId(expense.id);
                    setShowQuoteModal(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted transition-colors text-left"
                >
                  <div>
                    <p className="font-semibold text-sm">{expense.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Paid by {expense.paidByFirstName}</p>
                  </div>
                  <span className="font-mono font-bold text-primary">₹{expense.amount}</span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
