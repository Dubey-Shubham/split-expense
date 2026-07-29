"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db/db";
import { groups, groupMembers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// getGroupsAction
// Retrieves all groups that the currently logged-in user is a member of.
// It also enriches the group data with the total member count and the creator's full name.
export async function getGroupsAction() {
  try {
    // 1. Session Retrieval: Access the cookies to find the logged-in user's ID
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user")?.value;

    // 2. Auth Guard: If there is no user ID in the cookie, reject the request
    if (!userId) {
      return { success: false, error: "Unauthorized. Please log in first." };
    }

    // 3. Database Query (Join): Fetch groups where the user is a member
    const userGroups = await db
      .select({ // 1. select(): We specify exactly which columns we want to retrieve from the database.
        id: groups.id,
        name: groups.name,
        description: groups.description,
        avatar: groups.avatar,
        createdBy: groups.createdBy,
        createdAt: groups.createdAt,
      })
      .from(groupMembers) // 2. from(): We start our query on the 'groupMembers' table.
      .innerJoin(groups, eq(groupMembers.groupId, groups.id)) // 3. innerJoin(): We join the 'groups' table to get the actual group details.
      .where(eq(groupMembers.userId, userId)); // 4. where(): We filter the entire joined result.

    // 4. Data Enrichment: Loop over the groups to add extra information
    const enrichedGroups = [];
    for (const group of userGroups) {
      // 4a. Count Members: Query the groupMembers table to see how many users are in this group
      const membersList = await db
        .select() // .select(): Fetch all columns for the rows that match
        .from(groupMembers) // .from(): Look inside the 'groupMembers' table
        .where(eq(groupMembers.groupId, group.id)); // .where(): Only grab members that belong to this specific group.id

      // 4b. Get Creator Name: Look up the user who created the group to display their name
      const [creator] = await db
        .select({ // .select(): Fetch only the firstName and lastName to save bandwidth
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users) // .from(): Look inside the 'users' table
        .where(eq(users.id, group.createdBy)) // .where(): Find the exact user whose ID matches the group's 'createdBy' field
        .limit(1); // .limit(1): Stop searching after finding the first match (since IDs are unique, there's only one creator)

      // 4c. Assemble Final Object: Combine the base group data with the new calculated fields
      enrichedGroups.push({
        ...group,
        memberCount: membersList.length,
        creatorName: creator ? `${creator.firstName} ${creator.lastName}` : "System User",
      });
    }

    // 5. Success Return: Send the fully enriched list of groups back to the frontend component
    return { success: true, groups: enrichedGroups };
  } catch (err) {
    console.error("getGroupsAction Error:", err);
    return { success: false, error: "Failed to fetch groups." };
  }
}

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

    // 5. Cache Invalidation: Tell Next.js that the data on the "/groups" page is now stale.
    //    This forces the page to re-run getGroupsAction() on the server and show the new group instantly.
    revalidatePath("/groups");

    // 6. Success Return: Return the new group data to the frontend
    return { success: true, group: newGroup };
  } catch (err) {
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

    // 5. Cache Invalidation: Tell Next.js that the data on the "/groups" page is now stale.
    //    This forces the server to re-render the page without the deleted group.
    revalidatePath("/groups");

    // 6. Success Return
    return { success: true };
  } catch (err) {
    console.error("deleteGroupAction Error:", err);
    return { success: false, error: "Failed to delete the group." };
  }
}
