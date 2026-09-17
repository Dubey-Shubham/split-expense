"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db/db";
import { users, groupMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

export async function updateProfileAction(data: {
  firstName: string;
  lastName: string;
  upiId?: string;
  mobileNumber?: string;
}) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user")?.value;

    if (!userId) {
      return { success: false, error: "Unauthorized. Please log in first." };
    }

    if (!data.firstName.trim() || !data.lastName.trim()) {
      return { success: false, error: "First and last name are required." };
    }

    await db
      .update(users)
      .set({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        upiId: data.upiId?.trim() || null,
        mobileNumber: data.mobileNumber?.trim() || null,
      })
      .where(eq(users.id, userId));

    // Revalidate caches to reflect changes immediately
    revalidatePath("/profile");
    revalidatePath("/");
    // Revalidate the global cache tag for the user profile
    revalidateTag(`user-${userId}`, "hours");

    // Also revalidate any groups the user is in, so UPI changes reflect instantly in group balances
    const userMemberships = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));
      
    userMemberships.forEach((m) => {
      revalidateTag(`group-details-${m.groupId}`, "hours");
    });

    return { success: true };
  } catch (err: any) {
    if (err?.digest === "HANGING_PROMISE_REJECTION") throw err;
    console.error("updateProfileAction Error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}
