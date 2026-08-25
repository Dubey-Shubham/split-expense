"use server";

import { db } from "@/lib/db/db";
import { expenses, expenseSplits, expenseDisputes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";

interface CreateExpenseInput {
  groupId: string;
  description: string;
  amount: string; // Will be parsed to float
  category: string;
  paidBy: string; // User ID
  splits: { userId: string; amountOwed: string }[]; // Array of calculated splits
  date?: string; // Optional custom date (ISO string)
}

export interface EditExpenseInput extends CreateExpenseInput {
  expenseId: string;
}

export async function createExpenseAction(data: CreateExpenseInput) {
  try {
    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("session_user")?.value;

    if (!currentUserId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!data.groupId || !data.description || !data.amount || !data.paidBy || !data.splits || data.splits.length === 0) {
      return { success: false, error: "Missing required fields." };
    }

    const amountFloat = parseFloat(data.amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return { success: false, error: "Invalid amount." };
    }

    // Insert expense
    const [newExpense] = await db.insert(expenses).values({
      groupId: data.groupId,
      paidBy: data.paidBy,
      description: data.description,
      amount: amountFloat.toFixed(2),
      category: data.category,
      createdAt: data.date ? new Date(data.date) : new Date(),
    }).returning({ id: expenses.id });

    if (!newExpense) {
      throw new Error("Failed to create expense record.");
    }

    // Validate splits add up to amount
    const totalSplit = data.splits.reduce((sum, split) => sum + parseFloat(split.amountOwed), 0);
    if (Math.abs(totalSplit - amountFloat) > 0.05) { // allow 5 cents of rounding difference
      return { success: false, error: "Split amounts do not add up to the total." };
    }

    // Create splits
    const splitsToInsert = data.splits.map((split) => ({
      expenseId: newExpense.id,
      userId: split.userId,
      amountOwed: parseFloat(split.amountOwed).toFixed(2),
    }));

    await db.insert(expenseSplits).values(splitsToInsert);

    // Revalidate paths & tags
    revalidatePath(`/groups/${data.groupId}`);
    revalidateTag(`group-details-${data.groupId}`, "hours");

    return { success: true };
  } catch (error: any) {
    if (error?.digest === "HANGING_PROMISE_REJECTION") throw error;
    console.error("Create expense error:", error);
    return { success: false, error: "Failed to create expense." };
  }
}

export async function editExpenseAction(data: EditExpenseInput) {
  try {
    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("userId")?.value || cookieStore.get("session_user")?.value;

    if (!currentUserId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!data.expenseId || !data.groupId || !data.description || !data.amount || !data.paidBy || !data.splits || data.splits.length === 0) {
      return { success: false, error: "Missing required fields." };
    }

    const amountFloat = parseFloat(data.amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return { success: false, error: "Invalid amount." };
    }

    const totalSplit = data.splits.reduce((sum, split) => sum + parseFloat(split.amountOwed), 0);
    if (Math.abs(totalSplit - amountFloat) > 0.05) {
      return { success: false, error: "Split amounts do not add up to the total." };
    }

    // Update expense
    await db.update(expenses)
      .set({
        paidBy: data.paidBy,
        description: data.description,
        amount: amountFloat.toFixed(2),
        category: data.category,
        createdAt: data.date ? new Date(data.date) : new Date(),
      })
      .where(eq(expenses.id, data.expenseId));

    // Delete old splits
    await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, data.expenseId));

    // Create new splits
    const splitsToInsert = data.splits.map((split) => ({
      expenseId: data.expenseId,
      userId: split.userId,
      amountOwed: parseFloat(split.amountOwed).toFixed(2),
    }));

    await db.insert(expenseSplits).values(splitsToInsert);

    // Revalidate paths & tags
    revalidatePath(`/groups/${data.groupId}`);
    revalidateTag(`group-details-${data.groupId}`, "hours");

    return { success: true };
  } catch (error: any) {
    if (error?.digest === "HANGING_PROMISE_REJECTION") throw error;
    console.error("Edit expense error:", error);
    return { success: false, error: "Failed to edit expense." };
  }
}

export async function deleteExpenseAction(expenseId: string, groupId: string) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user")?.value;
    if (!userId) return { success: false, error: "Unauthorized" };

    // Delete the expense
    await db.delete(expenses).where(eq(expenses.id, expenseId));

    // Revalidate paths & tags
    revalidatePath(`/groups/${groupId}`);
    revalidateTag(`group-details-${groupId}`, "hours");

    return { success: true };
  } catch (error: any) {
    if (error?.digest === "HANGING_PROMISE_REJECTION") throw error;
    console.error("Delete expense error:", error);
    return { success: false, error: "Failed to delete expense." };
  }
}

export async function disputeExpenseAction(expenseId: string, groupId: string, reason: string) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user")?.value;
    if (!userId) return { success: false, error: "Unauthorized" };

    // Insert dispute
    await db.insert(expenseDisputes).values({
      expenseId,
      userId,
      reason,
    });

    // Revalidate paths & tags
    revalidatePath(`/groups/${groupId}`);
    revalidateTag(`group-details-${groupId}`, "hours");

    return { success: true };
  } catch (error: any) {
    if (error?.digest === "HANGING_PROMISE_REJECTION") throw error;
    console.error("Dispute expense error:", error);
    return { success: false, error: "Failed to submit dispute." };
  }
}

export async function withdrawDisputeAction(expenseId: string, groupId: string) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user")?.value;
    if (!userId) return { success: false, error: "Unauthorized" };

    // Delete dispute
    await db.delete(expenseDisputes).where(
      and(
        eq(expenseDisputes.expenseId, expenseId),
        eq(expenseDisputes.userId, userId)
      )
    );

    // Revalidate paths & tags
    revalidatePath(`/groups/${groupId}`);
    revalidateTag(`group-details-${groupId}`, "hours");

    return { success: true };
  } catch (error: any) {
    if (error?.digest === "HANGING_PROMISE_REJECTION") throw error;
    console.error("Withdraw dispute error:", error);
    return { success: false, error: "Failed to withdraw dispute." };
  }
}
