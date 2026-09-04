"use server";

import { db } from "@/lib/db/db";
import { groupMessages, groupMembers } from "@/lib/db/schema";
import { getCurrentUserAction } from "./auth";
import { pusherServer } from "@/lib/pusher";
import { eq, and } from "drizzle-orm";

export async function sendGroupMessageAction(groupId: string, content: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Unauthorized" };

    if (!content.trim()) return { success: false, error: "Message cannot be empty" };

    // Insert message
    const [newMessage] = await db.insert(groupMessages).values({
      groupId,
      userId: user.id,
      content: content.trim(),
    }).returning();

    // The data we broadcast is similar to what we fetch in getGroupMessages
    const messagePayload = {
      id: newMessage.id,
      groupId: newMessage.groupId,
      content: newMessage.content,
      isEdited: newMessage.isEdited,
      isDeleted: newMessage.isDeleted,
      createdAt: newMessage.createdAt,
      updatedAt: newMessage.updatedAt,
      userId: user.id,
      userFirstName: user.firstName,
      userLastName: user.lastName,
    };

    // Trigger pusher event to presence channel
    await pusherServer.trigger(`presence-group-${groupId}`, "new-message", messagePayload);

    return { success: true, message: messagePayload };
  } catch (error) {
    console.error("Send message error:", error);
    return { success: false, error: "Failed to send message" };
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

export async function updateLastReadAction(groupId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Unauthorized" };

    await db.update(groupMembers)
      .set({ lastReadAt: new Date() })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)));

    return { success: true };
  } catch (error) {
    console.error("Update last read error:", error);
    return { success: false, error: "Failed to update last read status" };
  }
}
