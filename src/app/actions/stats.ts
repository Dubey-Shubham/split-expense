"use server";

import { db } from "@/lib/db/db";
import { groupMembers, expenses, expenseSplits } from "@/lib/db/schema";
import { eq, sum, and, gte, count, SQL } from "drizzle-orm";
import { getCurrentUserAction } from "./auth";

export async function getUserStatsAction(timeframe: string = "max") {
  try {
    const user = await getCurrentUserAction();
    if (!user) return null;

    let startDate: Date | null = null;
    const now = new Date();

    switch (timeframe) {
      case "1d":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "1w":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "1m":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case "3m":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case "6m":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case "9m":
        startDate = new Date(now.getFullYear(), now.getMonth() - 9, now.getDate());
        break;
      case "1y":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case "max":
      default:
        startDate = null;
        break;
    }

    // 1. Total Groups Joined (Filtered)
    let groupWhere: SQL<unknown> | undefined = eq(groupMembers.userId, user.id);
    if (startDate) {
      groupWhere = and(groupWhere, gte(groupMembers.joinedAt, startDate));
    }
    const groupsCountResult = await db
      .select({ value: count() })
      .from(groupMembers)
      .where(groupWhere);
    const groupsCount = groupsCountResult[0]?.value || 0;

    // 2. Total Paid By Me (Filtered)
    let paidWhere: SQL<unknown> | undefined = eq(expenses.paidBy, user.id);
    if (startDate) {
      paidWhere = and(paidWhere, gte(expenses.createdAt, startDate));
    }
    const totalPaidResult = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(paidWhere);
    const totalPaid = parseFloat(totalPaidResult[0]?.total || "0");

    // 3. Total My Share (Total Spent) (Filtered)
    let shareWhere: SQL<unknown> | undefined = eq(expenseSplits.userId, user.id);
    if (startDate) {
      shareWhere = and(shareWhere, gte(expenses.createdAt, startDate));
    }
    const totalShareResult = await db
      .select({ total: sum(expenseSplits.amountOwed) })
      .from(expenseSplits)
      .innerJoin(expenses, eq(expenseSplits.expenseId, expenses.id))
      .where(shareWhere);
    const totalShare = parseFloat(totalShareResult[0]?.total || "0");

    // 4. Net Balance
    const netBalance = totalPaid - totalShare;

    // 5. Avg Group Spent
    const avgGroupSpent = groupsCount > 0 ? totalShare / groupsCount : 0;

    return {
      groupsCount,
      totalSpent: totalShare,
      avgGroupSpent,
      netBalance,
    };
  } catch (err) {
    console.error("Error fetching user stats:", err);
    return {
      groupsCount: 0,
      totalSpent: 0,
      avgGroupSpent: 0,
      netBalance: 0,
    };
  }
}

