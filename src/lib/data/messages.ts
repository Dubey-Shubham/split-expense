import { db } from "../db/db";
import { groupMessages, users } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export async function getGroupMessages(groupId: string, limit: number = 100) {
  const messages = await db
    .select({
      id: groupMessages.id,
      groupId: groupMessages.groupId,
      content: groupMessages.content,
      isEdited: groupMessages.isEdited,
      isDeleted: groupMessages.isDeleted,
      createdAt: groupMessages.createdAt,
      updatedAt: groupMessages.updatedAt,
      userId: users.id,
      userFirstName: users.firstName,
      userLastName: users.lastName,
    })
    .from(groupMessages)
    .innerJoin(users, eq(groupMessages.userId, users.id))
    .where(eq(groupMessages.groupId, groupId))
    .orderBy(desc(groupMessages.createdAt))
    .limit(limit);

  // We return them in ascending order for the chat UI (oldest first at top, newest at bottom)
  return messages.reverse();
}
