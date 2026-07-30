"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db/db";
import { groups, groupMembers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";



// createGroupAction
//--Creates a new group and automatically adds the creator as its first member
//--It accepts the group name, an optional description, and an avatar icon string.
export async function createGroupAction(data: {
  name: string;
  description?: string;
  avatar: string;
}) {
  try {
    // 1. Session Retrieval: Ensure the user is logged in
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user")?.value;

    if (!userId) {
      return { success: false, error: "Unauthorized. Please log in first." };
    }

    // 2. Validation: Ensure the group name isn't just empty spaces
    if (!data.name.trim()) {
      return { success: false, error: "Group name is required." };
    }

    // 3. Database Insert (Group): Insert the new group into the 'groups' table
    //    We use .returning() to immediately get back the newly created row (including its generated ID)
    const [newGroup] = await db
      .insert(groups)
      .values({
        name: data.name.trim(),
        description: data.description?.trim() || "",
        avatar: data.avatar,
        createdBy: userId,
      })
      .returning();

    if (!newGroup) {
      return { success: false, error: "Failed to create group." };
    }

    // 4. Database Insert (Membership): Link the user to the newly created group
    //    A group without members is useless, so the creator must be added to 'groupMembers' immediately.
    await db.insert(groupMembers).values({
      groupId: newGroup.id,
      userId: userId,
    });

    // 5. Cache Invalidation
    revalidatePath("/groups");
    revalidateTag(`groups-${userId}`, "hours");

    // 6. Success Return: Return the new group data to the frontend
    return { success: true, group: newGroup };
  } catch (err: any) {
    if (err?.digest === "HANGING_PROMISE_REJECTION") throw err;
    console.error("createGroupAction Error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// deleteGroupAction: Deletes a specific group by ID, but only if the user making the request is the original creator.
export async function deleteGroupAction(groupId: string) {
  try {
    // 1. Session Retrieval: Ensure the user is logged in
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user")?.value;

    if (!userId) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // 2. Ownership Verification: Fetch the target group to see who created it
    const [group] = await db
      .select() // .select(): Grab all columns from the group row
      .from(groups) // .from(): Look in the 'groups' table
      .where(eq(groups.id, groupId)) // .where(): Filter for the specific group ID we want to delete
      .limit(1); // .limit(1): We only expect one group with this ID, so stop after finding it

    if (!group) {
      return { success: false, error: "Group not found." };
    }

    // 3. Security Guard: Prevent anyone other than the creator from deleting the group
    if (group.createdBy !== userId) {
      return { success: false, error: "Only the group creator can delete this group." };
    }

    // 4. Database Deletion: Remove the group from the 'groups' table.
    //    Because we set up foreign key cascade deletes in our schema, this will automatically 
    //    delete all 'groupMembers' and (future) 'expenses' linked to this group ID!
    await db.delete(groups).where(eq(groups.id, groupId));

    // 5. Cache Invalidation
    revalidatePath("/groups");
    revalidateTag(`groups-${userId}`, "hours");

    // 6. Success Return
    return { success: true };
  } catch (err: any) {
    if (err?.digest === "HANGING_PROMISE_REJECTION") throw err;
    console.error("deleteGroupAction Error:", err);
    return { success: false, error: "Failed to delete the group." };
  }
}
