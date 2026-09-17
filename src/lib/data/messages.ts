import { db } from "../db/db";
import { groupMessages, users, expenses } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const repliedMessages = alias(groupMessages, "replied_messages");
const repliedUsers = alias(users, "replied_users");

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
      quotedExpenseId: groupMessages.quotedExpenseId,
      quotedExpenseDescription: expenses.description,
      quotedExpenseAmount: expenses.amount,
      repliedToMessageId: groupMessages.repliedToMessageId,
      repliedToMessageContent: repliedMessages.content,
      repliedToUserFirstName: repliedUsers.firstName,
      repliedToUserLastName: repliedUsers.lastName,
    })
    .from(groupMessages)
    .innerJoin(users, eq(groupMessages.userId, users.id))
    .leftJoin(expenses, eq(groupMessages.quotedExpenseId, expenses.id))
    .leftJoin(repliedMessages, eq(groupMessages.repliedToMessageId, repliedMessages.id))
    .leftJoin(repliedUsers, eq(repliedMessages.userId, repliedUsers.id))
    .where(eq(groupMessages.groupId, groupId))
    .orderBy(desc(groupMessages.createdAt))
    .limit(limit);

  // We return them in ascending order for the chat UI (oldest first at top, newest at bottom)
  return messages.reverse();
}
