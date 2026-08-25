import { db } from "../db/db";
import { expenses, expenseSplits, expenseDisputes, users } from "../db/schema";
import { eq, desc, inArray } from "drizzle-orm";

export async function getGroupExpenses(groupId: string) {
  const expensesList = await db
    .select({
      id: expenses.id,
      groupId: expenses.groupId,
      description: expenses.description,
      amount: expenses.amount,
      category: expenses.category,
      createdAt: expenses.createdAt,
      paidById: users.id,
      paidByFirstName: users.firstName,
      paidByLastName: users.lastName,
    })
    .from(expenses)
    .innerJoin(users, eq(expenses.paidBy, users.id))
    .where(eq(expenses.groupId, groupId))
    .orderBy(desc(expenses.createdAt));

  if (expensesList.length === 0) return [];

  const expenseIds = expensesList.map((e) => e.id);

  const splits = await db
    .select({
      id: expenseSplits.id,
      expenseId: expenseSplits.expenseId,
      userId: expenseSplits.userId,
      amountOwed: expenseSplits.amountOwed,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(expenseSplits)
    .innerJoin(users, eq(expenseSplits.userId, users.id))
    .where(inArray(expenseSplits.expenseId, expenseIds));

  const disputes = await db
    .select({
      id: expenseDisputes.id,
      expenseId: expenseDisputes.expenseId,
      userId: expenseDisputes.userId,
      reason: expenseDisputes.reason,
      createdAt: expenseDisputes.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(expenseDisputes)
    .innerJoin(users, eq(expenseDisputes.userId, users.id))
    .where(inArray(expenseDisputes.expenseId, expenseIds));

  // Combine them
  return expensesList.map((expense) => {
    return {
      ...expense,
      splits: splits.filter((s) => s.expenseId === expense.id),
      disputes: disputes.filter((d) => d.expenseId === expense.id),
    };
  });
}
