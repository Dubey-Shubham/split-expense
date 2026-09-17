"use server";

import { db } from "@/lib/db/db";
import { groupMessages, groupMembers, expenses, users } from "@/lib/db/schema";
import { getCurrentUserAction } from "./auth";
import { pusherServer } from "@/lib/pusher";
import { eq, and } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export async function sendGroupMessageAction(groupId: string, content: string, quotedExpenseId?: string, repliedToMessageId?: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Unauthorized" };

    if (!content.trim() && !quotedExpenseId) return { success: false, error: "Message cannot be empty" };

    // Insert message
    const [newMessage] = await db.insert(groupMessages).values({
      groupId,
      userId: user.id,
      content: content.trim(),
      quotedExpenseId: quotedExpenseId || null,
      repliedToMessageId: repliedToMessageId || null,
    }).returning();

    // Fetch quoted expense details if exists
    let quotedExpenseDescription = null;
    let quotedExpenseAmount = null;

    if (quotedExpenseId) {
      const [expense] = await db.select().from(expenses).where(eq(expenses.id, quotedExpenseId));
      if (expense) {
        quotedExpenseDescription = expense.description;
        quotedExpenseAmount = expense.amount;
      }
    }

    // Fetch replied message details if exists
    let repliedToMessageContent = null;
    let repliedToUserFirstName = null;
    let repliedToUserLastName = null;

    if (repliedToMessageId) {
      const [repliedMsg] = await db
        .select({
          content: groupMessages.content,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(groupMessages)
        .innerJoin(users, eq(groupMessages.userId, users.id))
        .where(eq(groupMessages.id, repliedToMessageId));

      if (repliedMsg) {
        repliedToMessageContent = repliedMsg.content;
        repliedToUserFirstName = repliedMsg.firstName;
        repliedToUserLastName = repliedMsg.lastName;
      }
    }

    // The data we broadcast is similar to what we fetch in getGroupMessages
    const messagePayload = {
      id: newMessage.id,
      groupId: newMessage.groupId,
      content: newMessage.content,
      isEdited: newMessage.isEdited,
      isDeleted: newMessage.isDeleted,
      quotedExpenseId: newMessage.quotedExpenseId,
      quotedExpenseDescription,
      quotedExpenseAmount,
      repliedToMessageId: newMessage.repliedToMessageId,
      repliedToMessageContent,
      repliedToUserFirstName,
      repliedToUserLastName,
      createdAt: newMessage.createdAt,
      updatedAt: newMessage.updatedAt,
      userId: user.id,
      userFirstName: user.firstName,
      userLastName: user.lastName,
    };

    // Trigger pusher event to presence channel
    await pusherServer.trigger(`presence-group-${groupId}`, "new-message", messagePayload);

    revalidateTag(`group-details-${groupId}`, "hours");
    // Unfortunately we can't easily invalidate `groups-otherUserId`, but revalidating the group details will help

    return { success: true, message: messagePayload };
  } catch (error: any) {
    console.error("[sendGroupMessageAction error]:", error);
    return { success: false, error: error?.message || "Failed to send message" };
  }
}

export async function editGroupMessageAction(messageId: string, groupId: string, newContent: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Unauthorized" };

    if (!newContent.trim()) return { success: false, error: "Message cannot be empty" };

    const [updatedMessage] = await db.update(groupMessages)
      .set({
        content: newContent.trim(),
        isEdited: true,
        updatedAt: new Date()
      })
      .where(and(eq(groupMessages.id, messageId), eq(groupMessages.userId, user.id)))
      .returning();

    if (!updatedMessage) {
      return { success: false, error: "Message not found or unauthorized" };
    }

    const messagePayload = {
      id: updatedMessage.id,
      content: updatedMessage.content,
      isEdited: updatedMessage.isEdited,
      updatedAt: updatedMessage.updatedAt,
    };

    await pusherServer.trigger(`presence-group-${groupId}`, "message-updated", messagePayload);

    return { success: true };
  } catch (error) {
    console.error("Edit message error:", error);
    return { success: false, error: "Failed to edit message" };
  }
}

export async function deleteGroupMessageAction(messageId: string, groupId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Unauthorized" };

    const [deletedMessage] = await db.update(groupMessages)
      .set({
        isDeleted: true,
        content: "", // Clear content on delete for privacy
        updatedAt: new Date()
      })
      .where(and(eq(groupMessages.id, messageId), eq(groupMessages.userId, user.id)))
      .returning();

    if (!deletedMessage) {
      return { success: false, error: "Message not found or unauthorized" };
    }

    await pusherServer.trigger(`presence-group-${groupId}`, "message-deleted", { id: messageId });

    return { success: true };
  } catch (error) {
    console.error("Delete message error:", error);
    return { success: false, error: "Failed to delete message" };
  }
}

export async function updateLastReadMessagesAction(groupId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Unauthorized" };

    await db.update(groupMembers)
      .set({ lastReadMessagesAt: new Date() })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)));

    revalidateTag(`groups-${user.id}`, "hours");
    revalidateTag(`group-details-${groupId}`, "hours");

    return { success: true };
  } catch (error) {
    console.error("Update last read error:", error);
    return { success: false, error: "Failed to update last read status" };
  }
}

export async function updateLastReadExpensesAction(groupId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Unauthorized" };

    await db.update(groupMembers)
      .set({ lastReadExpensesAt: new Date() })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)));

    revalidateTag(`groups-${user.id}`, "hours");
    revalidateTag(`group-details-${groupId}`, "hours");

    return { success: true };
  } catch (error) {
    console.error("Update last read error:", error);
    return { success: false, error: "Failed to update last read status" };
  }
}
