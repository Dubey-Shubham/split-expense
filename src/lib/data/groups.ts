// Import Next.js 15 cache utilities for on-demand tag revalidation and lifetime configuration
import { cacheTag, cacheLife } from "next/cache";
import { db } from "@/lib/db/db";
import { groups, groupMembers, users, expenses, groupMessages } from "@/lib/db/schema";
import { eq, and, gt, count } from "drizzle-orm";

// Export the asynchronous data fetcher function that retrieves all groups for a given user ID
export async function getGroupsForUser(userId: string) {
  "use cache";                        // Instructs Next.js App Router to cache the return value of this entire function
  cacheTag(`groups-${userId}`);       // Assigns a unique cache key tag for this user (e.g. 'groups-usr123') so we can invalidate it with revalidateTag()
  cacheLife("hours");                 // Configures the cache lifetime profile to 'hours' (automatically refreshes/stales after a few hours)

  // Query PostgreSQL database to fetch all groups where this user is listed as a member
  const userGroups = await db
    // Select specific columns from the 'groups' table to minimize bandwidth and memory usage
    .select({
      id: groups.id,                 // Group unique ID
      name: groups.name,             // Name of the group
      description: groups.description, // Group description text
      avatar: groups.avatar,         // Category icon / avatar key
      createdBy: groups.createdBy,   // User ID of the group creator
      createdAt: groups.createdAt,   // Group creation timestamp
      lastReadExpensesAt: groupMembers.lastReadExpensesAt,
      lastReadMessagesAt: groupMembers.lastReadMessagesAt,
    })
    // Start query from the junction table 'groupMembers'
    .from(groupMembers)
    // Perform an INNER JOIN between 'groupMembers' and 'groups' on matching group IDs
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    // Filter rows to only include records where groupMembers.userId matches the requested userId
    .where(eq(groupMembers.userId, userId));

  // Enrich each group with extra details (member count and creator name) concurrently using Promise.all
  const enrichedGroups = await Promise.all(
    // Map over each basic group record returned from the initial database join query
    userGroups.map(async (group) => {
      // Execute the member count query and the creator lookup query in parallel for max performance
      const [membersList, creatorArr, unreadExpensesArr, unreadMessagesArr] = await Promise.all([
        // Sub-query 1: Fetch all members belonging to this specific group to compute total member count
        db.select().from(groupMembers).where(eq(groupMembers.groupId, group.id)),

        // Sub-query 2: Look up the creator's full name from the 'users' table using creator ID
        db.select({ firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(eq(users.id, group.createdBy))
          .limit(1), // Limit to 1 row since user IDs are unique
          
        // Sub-query 3: Count unread expenses
        db.select({ value: count() })
          .from(expenses)
          .where(and(eq(expenses.groupId, group.id), gt(expenses.createdAt, group.lastReadExpensesAt))),
          
        // Sub-query 4: Count unread messages
        db.select({ value: count() })
          .from(groupMessages)
          .where(and(eq(groupMessages.groupId, group.id), gt(groupMessages.createdAt, group.lastReadMessagesAt)))
      ]);

      // Extract the first creator record from the array result (or undefined if not found)
      const creator = creatorArr[0];
      const unreadExpensesCount = unreadExpensesArr[0]?.value || 0;
      const unreadMessagesCount = unreadMessagesArr[0]?.value || 0;

      // Return a consolidated group object containing all original properties plus enriched fields
      return {
        ...group, // Spread existing group properties (id, name, description, avatar, createdBy, createdAt)
        memberCount: membersList.length, // Total count of members in this group
        creatorName: creator ? `${creator.firstName} ${creator.lastName}` : "System User", // Formatted creator name
        unreadExpensesCount,
        unreadMessagesCount,
      };
    })
  );

  // Return the final list of enriched, cached group objects
  return enrichedGroups;
}

export async function getGroupDetails(groupId: string, currentUserId: string) {
  "use cache";
  cacheTag(`group-details-${groupId}`);
  cacheLife("hours");

  // 1. Verify the current user is actually a member of this group for strict security
  const [membership] = await db
    .select()
    .from(groupMembers)
    .where(and(
      eq(groupMembers.groupId, groupId),
      eq(groupMembers.userId, currentUserId)
    ))
    .limit(1);

  if (!membership) {
    return null; // Unauthorized or group doesn't exist
  }

  // 2. Fetch Group Details
  const [groupInfo] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  if (!groupInfo) return null;

  // 3. Fetch all Members of the group (joining groupMembers with users)
  const members = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId));

  // 4. Calculate unread counts
  const unreadExpensesArr = await db.select({ value: count() })
    .from(expenses)
    .where(and(eq(expenses.groupId, groupId), gt(expenses.createdAt, membership.lastReadExpensesAt)));

  const unreadMessagesArr = await db.select({ value: count() })
    .from(groupMessages)
    .where(and(eq(groupMessages.groupId, groupId), gt(groupMessages.createdAt, membership.lastReadMessagesAt)));

  const unreadExpensesCount = unreadExpensesArr[0]?.value || 0;
  const unreadMessagesCount = unreadMessagesArr[0]?.value || 0;

  return {
    ...groupInfo,
    members,
    unreadExpensesCount,
    unreadMessagesCount
  };
}
