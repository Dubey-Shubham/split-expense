// Import Next.js 15 cache utilities for on-demand tag revalidation and lifetime configuration
import { cacheTag, cacheLife } from "next/cache";

// Import database client instance (Drizzle ORM connected to PostgreSQL)
import { db } from "@/lib/db/db";

// Import Drizzle table schema definitions for groups, groupMembers, and users
import { groups, groupMembers, users } from "@/lib/db/schema";

// Import equality operator 'eq' from Drizzle ORM to build SQL WHERE clauses
import { eq } from "drizzle-orm";

// Export the asynchronous data fetcher function that retrieves all groups for a given user ID
export async function getGroupsForUser(userId: string) {
  // Instructs Next.js App Router to cache the return value of this entire function
  "use cache";

  // Assigns a unique cache key tag for this user (e.g. 'groups-usr123') so we can invalidate it with revalidateTag()
  cacheTag(`groups-${userId}`);

  // Configures the cache lifetime profile to 'hours' (automatically refreshes/stales after a few hours)
  cacheLife("hours");

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
      const [membersList, creatorArr] = await Promise.all([
        // Sub-query 1: Fetch all members belonging to this specific group to compute total member count
        db.select().from(groupMembers).where(eq(groupMembers.groupId, group.id)),

        // Sub-query 2: Look up the creator's full name from the 'users' table using creator ID
        db.select({ firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(eq(users.id, group.createdBy))
          .limit(1) // Limit to 1 row since user IDs are unique
      ]);

      // Extract the first creator record from the array result (or undefined if not found)
      const creator = creatorArr[0];

      // Return a consolidated group object containing all original properties plus enriched fields
      return {
        ...group, // Spread existing group properties (id, name, description, avatar, createdBy, createdAt)
        memberCount: membersList.length, // Total count of members in this group
        creatorName: creator ? `${creator.firstName} ${creator.lastName}` : "System User", // Formatted creator name
      };
    })
  );

  // Return the final list of enriched, cached group objects
  return enrichedGroups;
}
